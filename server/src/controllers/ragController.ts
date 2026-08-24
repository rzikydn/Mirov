// RAG Knowledge Base Controller
// Handles document upload, FAQ input, retrieval, and debug queries

import { Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import { ragDocuments, ragChunks } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { extractPDF, extractDOCX, extractPPTX } from '../utils/extractors';
import { chunkDocument } from '../utils/chunker';
import { embedText, embedBatch, cosineSimilarity } from '../utils/embeddings';

// Multer config: store in memory (files are processed then discarded)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype) || /\.(pdf|docx|pptx)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF, DOCX, atau PPTX yang didukung'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

/**
 * POST /api/rag/upload — Upload and process a document file
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    const fileName = file.originalname;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const docType = ext === 'pdf' ? 'PDF' : ext === 'docx' ? 'DOCX' : ext === 'pptx' ? 'PPTX' : null;
    if (!docType) {
      return res.status(400).json({ success: false, message: 'Tipe file tidak didukung' });
    }

    const category = (req.body.category as string) || 'Dokumen Resmi';
    const reqApiKey = (req.body.apiKey as string) || (req.headers['x-gemini-api-key'] as string);

    // 1. Insert document record with PROCESSING status
    const [inserted] = await db.insert(ragDocuments).values({
      title: fileName,
      type: docType as 'PDF' | 'DOCX' | 'PPTX',
      category,
      fileSize: file.size,
      status: 'PROCESSING',
    }).$returningId();

    const docId = inserted.id;

    // 2. Process async (don't block response)
    processDocumentAsync(docId, file.buffer, docType, reqApiKey).catch(err => {
      console.error(`[RAG] Processing failed for doc ${docId}:`, err);
    });

    return res.status(201).json({
      success: true,
      message: 'File diterima, sedang diproses...',
      document: { id: docId, title: fileName, type: docType, status: 'PROCESSING' },
    });
  } catch (error: any) {
    console.error('[RAG] Upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Upload gagal' });
  }
}

/**
 * Background processing: extract → chunk → embed → store
 */
async function processDocumentAsync(docId: number, buffer: Buffer, type: string, apiKey?: string) {
  try {
    // 1. Extract
    console.log(`[RAG] Extracting doc ${docId} (${type})...`);
    let sections;
    if (type === 'PDF') sections = await extractPDF(buffer);
    else if (type === 'DOCX') sections = await extractDOCX(buffer);
    else if (type === 'PPTX') sections = await extractPPTX(buffer);
    else throw new Error(`Unknown type: ${type}`);

    const nonEmpty = sections.filter(s => s.content.trim());
    if (nonEmpty.length === 0) {
      await db.update(ragDocuments).set({
        status: 'ERROR',
        errorMessage: 'Tidak ada teks yang berhasil diekstrak dari file. File mungkin berupa scan/gambar (memerlukan OCR).',
      }).where(eq(ragDocuments.id, docId));
      return;
    }

    // 2. Chunk
    console.log(`[RAG] Chunking doc ${docId}: ${nonEmpty.length} sections...`);
    const chunks = chunkDocument(nonEmpty);
    if (chunks.length === 0) {
      await db.update(ragDocuments).set({
        status: 'ERROR',
        errorMessage: 'Chunking menghasilkan 0 chunks — konten terlalu pendek.',
      }).where(eq(ragDocuments.id, docId));
      return;
    }

    // 3. Embed
    console.log(`[RAG] Embedding doc ${docId}: ${chunks.length} chunks...`);
    const texts = chunks.map(c => `${c.heading}: ${c.content}`);

    let embeddings: number[][];
    try {
      embeddings = await embedBatch(texts, apiKey);
    } catch (embErr: any) {
      // If embedding fails (no API key, quota exceeded), still store chunks without embeddings
      console.warn(`[RAG] Embedding failed for doc ${docId}, storing without vectors:`, embErr.message);
      embeddings = chunks.map(() => []);
    }

    // 4. Store chunks
    console.log(`[RAG] Storing ${chunks.length} chunks for doc ${docId}...`);
    const chunkValues = chunks.map((chunk, i) => ({
      documentId: docId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      heading: chunk.heading.slice(0, 500),
      pageOrSlide: chunk.pageOrSlide ?? null,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[i]?.length > 0 ? embeddings[i] : null,
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkValues.length; i += 50) {
      await db.insert(ragChunks).values(chunkValues.slice(i, i + 50));
    }

    // 5. Update document status
    await db.update(ragDocuments).set({
      status: 'INDEXED',
      totalChunks: chunks.length,
    }).where(eq(ragDocuments.id, docId));

    console.log(`[RAG] ✅ Doc ${docId} indexed: ${chunks.length} chunks`);
  } catch (error: any) {
    console.error(`[RAG] Processing error for doc ${docId}:`, error);
    await db.update(ragDocuments).set({
      status: 'ERROR',
      errorMessage: error.message || 'Processing failed',
    }).where(eq(ragDocuments.id, docId));
  }
}

/**
 * POST /api/rag/faq — Add a FAQ entry
 */
export async function addFAQ(req: Request, res: Response) {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Pertanyaan dan jawaban wajib diisi' });
    }

    // 1. Insert FAQ document
    const [inserted] = await db.insert(ragDocuments).values({
      title: question.slice(0, 500),
      type: 'FAQ',
      category: category || 'Umum',
      status: 'PROCESSING',
      question,
      answer,
    }).$returningId();

    const docId = inserted.id;

    // 2. Create single chunk from Q+A
    const faqText = `Pertanyaan: ${question}\nJawaban: ${answer}`;
    let embedding: number[] = [];
    try {
      embedding = await embedText(faqText);
    } catch (e: any) {
      console.warn('[RAG] FAQ embedding failed:', e.message);
    }

    await db.insert(ragChunks).values({
      documentId: docId,
      chunkIndex: 0,
      content: faqText,
      heading: question.slice(0, 500),
      tokenCount: Math.ceil(faqText.length / 4),
      embedding: embedding.length > 0 ? embedding : null,
    });

    await db.update(ragDocuments).set({
      status: 'INDEXED',
      totalChunks: 1,
    }).where(eq(ragDocuments.id, docId));

    return res.status(201).json({
      success: true,
      document: { id: docId, title: question, type: 'FAQ', status: 'INDEXED' },
    });
  } catch (error: any) {
    console.error('[RAG] FAQ error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/rag/documents — List all RAG documents
 */
export async function listDocuments(_req: Request, res: Response) {
  try {
    const docs = await db.select().from(ragDocuments).orderBy(desc(ragDocuments.createdAt));
    return res.json({ success: true, documents: docs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/rag/documents/:id — Delete a document and its chunks
 */
export async function deleteDocument(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    await db.delete(ragChunks).where(eq(ragChunks.documentId, id));
    await db.delete(ragDocuments).where(eq(ragDocuments.id, id));

    return res.json({ success: true, message: 'Dokumen dan chunks berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/rag/retrieve — Semantic search for chat context injection
 * Body: { query: string, topK?: number, faqOnly?: boolean, apiKey?: string }
 * Returns top-K most relevant chunks with similarity scores
 */
export async function retrieveChunks(req: Request, res: Response) {
  try {
    const { query, topK = 5, faqOnly = false, apiKey } = req.body;
    const reqApiKey = apiKey || (req.headers['x-gemini-api-key'] as string);
    if (!query) return res.status(400).json({ success: false, message: 'Query required' });

    // Embed the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedText(query, reqApiKey);
    } catch (e: any) {
      // Fallback to keyword search if embedding fails
      return keywordFallbackSearch(query, topK, faqOnly, res);
    }

    // Get all chunks (with embeddings)
    let allChunks;
    if (faqOnly) {
      // Only FAQ chunks
      const faqDocs = await db.select({ id: ragDocuments.id })
        .from(ragDocuments)
        .where(eq(ragDocuments.type, 'FAQ'));
      const faqDocIds = faqDocs.map(d => d.id);
      if (faqDocIds.length === 0) return res.json({ success: true, results: [] });

      allChunks = await db.select().from(ragChunks);
      allChunks = allChunks.filter(c => faqDocIds.includes(c.documentId));
    } else {
      allChunks = await db.select().from(ragChunks);
    }

    // Compute similarity scores
    const scored = allChunks
      .filter(chunk => chunk.embedding && Array.isArray(chunk.embedding) && (chunk.embedding as number[]).length > 0)
      .map(chunk => ({
        ...chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Fetch parent document info
    const results = [];
    for (const chunk of scored) {
      const [doc] = await db.select().from(ragDocuments).where(eq(ragDocuments.id, chunk.documentId));
      results.push({
        content: chunk.content,
        heading: chunk.heading,
        pageOrSlide: chunk.pageOrSlide,
        similarity: chunk.similarity,
        documentTitle: doc?.title || 'Unknown',
        documentType: doc?.type || 'Unknown',
        question: doc?.question,
        answer: doc?.answer,
      });
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    console.error('[RAG] Retrieve error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Synonym map for domain queries (Indonesian & English terms)
const DOMAIN_SYNONYMS: Record<string, string[]> = {
  kantor: ['alamat', 'lokasi', 'gedung', 'office', 'kontak', 'tempat', 'posisi', 'terletak', 'dimana', 'jalan'],
  letak: ['alamat', 'lokasi', 'gedung', 'office', 'tempat', 'posisi', 'terletak'],
  lokasi: ['alamat', 'kantor', 'gedung', 'office', 'tempat', 'posisi', 'terletak', 'tuk'],
  dimana: ['alamat', 'lokasi', 'kantor', 'gedung', 'office', 'terletak', 'posisi'],
  alamat: ['kantor', 'lokasi', 'gedung', 'office', 'terletak', 'jalan'],
  biaya: ['tarif', 'harga', 'rp', 'pembayaran', 'bayar', 'rekening', 'bni'],
  harga: ['biaya', 'tarif', 'rp', 'pembayaran', 'bayar'],
  jadwal: ['tanggal', 'periode', 'waktu', 'asesmen', 'ujian', 'pelaksanaan'],
  kapan: ['jadwal', 'tanggal', 'periode', 'waktu', 'pelaksanaan'],
  syarat: ['persyaratan', 'dokumen', 'ijazah', 'ktp', 'berkas', 'kualifikasi'],
};

/**
 * Keyword fallback with synonym expansion when embedding API is unavailable
 */
async function keywordFallbackSearch(query: string, topK: number, faqOnly: boolean, res: Response) {
  const queryLower = query.toLowerCase().trim();
  const rawWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  if (rawWords.length === 0) return res.json({ success: true, results: [] });

  // Expand query words with synonyms
  const expandedWords = new Set<string>(rawWords);
  for (const word of rawWords) {
    if (DOMAIN_SYNONYMS[word]) {
      DOMAIN_SYNONYMS[word].forEach(syn => expandedWords.add(syn));
    }
  }

  let allChunks = await db.select().from(ragChunks);

  if (faqOnly) {
    const faqDocs = await db.select({ id: ragDocuments.id })
      .from(ragDocuments)
      .where(eq(ragDocuments.type, 'FAQ'));
    const faqDocIds = new Set(faqDocs.map(d => d.id));
    allChunks = allChunks.filter(c => faqDocIds.has(c.documentId));
  }

  const scored = allChunks.map(chunk => {
    const text = `${chunk.heading || ''} ${chunk.content}`.toLowerCase();
    let exactMatches = 0;
    let synonymMatches = 0;

    for (const word of rawWords) {
      if (text.includes(word)) exactMatches++;
    }
    for (const syn of expandedWords) {
      if (!rawWords.includes(syn) && text.includes(syn)) synonymMatches++;
    }

    const totalScore = exactMatches + synonymMatches * 0.6;
    const similarity = totalScore / Math.max(rawWords.length, 1);
    return { ...chunk, similarity };
  })
  .filter(c => c.similarity > 0)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, topK);

  const results = [];
  for (const chunk of scored) {
    const [doc] = await db.select().from(ragDocuments).where(eq(ragDocuments.id, chunk.documentId));
    results.push({
      content: chunk.content,
      heading: chunk.heading,
      pageOrSlide: chunk.pageOrSlide,
      similarity: chunk.similarity,
      documentTitle: doc?.title || 'Unknown',
      documentType: doc?.type || 'Unknown',
      question: doc?.question,
      answer: doc?.answer,
    });
  }

  return res.json({ success: true, results, fallback: 'keyword' });
}

/**
 * POST /api/rag/debug-query — Debug retrieval (skip LLM, show raw scores)
 * For isolating "stored but wrong answer" issues
 */
export async function debugQuery(req: Request, res: Response) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Query required' });

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embedText(query);
    } catch (e: any) {
      console.warn('[RAG Debug] Embedding failed, using keyword only:', e.message);
    }

    const allChunks = await db.select().from(ragChunks);
    const queryWords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    const scored = allChunks.map(chunk => {
      // Semantic score
      let semanticScore = 0;
      if (queryEmbedding && chunk.embedding && Array.isArray(chunk.embedding) && (chunk.embedding as number[]).length > 0) {
        semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding as number[]);
      }

      // Keyword score
      const text = `${chunk.heading || ''} ${chunk.content}`.toLowerCase();
      let keywordScore = 0;
      for (const word of queryWords) {
        if (text.includes(word)) keywordScore++;
      }
      keywordScore = queryWords.length > 0 ? keywordScore / queryWords.length : 0;

      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        heading: chunk.heading,
        contentPreview: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
        semanticScore: Math.round(semanticScore * 1000) / 1000,
        keywordScore: Math.round(keywordScore * 1000) / 1000,
        combinedScore: Math.round((semanticScore * 0.7 + keywordScore * 0.3) * 1000) / 1000,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 20);

    return res.json({
      success: true,
      query,
      embeddingAvailable: !!queryEmbedding,
      totalChunks: allChunks.length,
      results: scored,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
