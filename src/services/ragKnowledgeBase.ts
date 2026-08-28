// RAG Vector Knowledge Base — Server-Backed Service for BSMR Chatbot
// All data now lives on the Express server (MySQL). localStorage is fallback only.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const RAG_API = `${API_BASE}/api/rag`;

export interface RagDocument {
  id: number;
  title: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'FAQ';
  category: string | null;
  fileSize: number | null;
  totalChunks: number | null;
  status: 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'ERROR';
  errorMessage: string | null;
  question: string | null;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RetrievalResult {
  content: string;
  heading: string | null;
  pageOrSlide: number | null;
  similarity: number;
  documentTitle: string;
  documentType: string;
  question: string | null;
  answer: string | null;
}

export interface RagQueryResult {
  contextForLlm: string;
  conciseFallback: string;
  isFaq?: boolean;
}

/**
 * Upload a document file (PDF/DOCX/PPTX) to the RAG pipeline
 */
export async function uploadRagDocument(file: File, category?: string): Promise<{ success: boolean; document?: RagDocument; message?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);

  const res = await fetch(`${RAG_API}/upload`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

/**
 * Add a FAQ entry to the RAG Knowledge Base
 */
export async function addRagFAQ(question: string, answer: string, category?: string): Promise<{ success: boolean; document?: RagDocument }> {
  const res = await fetch(`${RAG_API}/faq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, category }),
  });
  return res.json();
}

/**
 * List all RAG documents from server
 */
export async function listRagDocuments(): Promise<RagDocument[]> {
  try {
    const res = await fetch(`${RAG_API}/documents`);
    const data = await res.json();
    return data.documents || [];
  } catch {
    return [];
  }
}

/**
 * Delete a RAG document and its chunks
 */
export async function deleteRagDocument(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${RAG_API}/documents/${id}`, { method: 'DELETE' });
  return res.json();
}

/**
 * Semantic retrieval — get top-K chunks relevant to query
 * Used by aiChatEngine for context injection
 */
export async function retrieveRagContext(query: string, topK = 5, faqOnly = false, apiKey?: string): Promise<RetrievalResult[]> {
  try {
    const res = await fetch(`${RAG_API}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK, faqOnly, apiKey }),
    });
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Extract concise relevant snippet from chunk content for offline fallback
 */
function extractConciseSnippet(content: string, userQuery: string): string {
  if (content.includes('DATA OPERASIONAL UMUM')) return '';
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const stopWords = ['sertifikasi', 'bsmr', 'ada', 'apa', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'ini', 'itu', 'saya', 'bisa', 'bagaimana', 'apakah'];
  const rawWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const queryWords = rawWords.filter(w => !stopWords.includes(w));
  const effectiveWords = queryWords.length > 0 ? queryWords : rawWords;

  const matchingLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    const isMatch = effectiveWords.some(w =>
      lineLower.includes(w) ||
      (w.includes('kantor') && (lineLower.includes('alamat') || lineLower.includes('office') || lineLower.includes('gedung') || lineLower.includes('lokasi'))) ||
      (w.includes('letak') && (lineLower.includes('alamat') || lineLower.includes('posisi') || lineLower.includes('terletak'))) ||
      (w.includes('biaya') && (lineLower.includes('biaya') || lineLower.includes('rp') || lineLower.includes('tarif'))) ||
      (w.includes('jadwal') && (lineLower.includes('jadwal') || lineLower.includes('tanggal') || lineLower.includes('periode'))) ||
      (w.includes('siap') && (lineLower.includes('syarat') || lineLower.includes('tahap') || lineLower.includes('dokumen') || lineLower.includes('persyaratan')))
    );

    if (isMatch) {
      const contextLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3));
      contextLines.forEach(cl => {
        if (!matchingLines.includes(cl)) matchingLines.push(cl);
      });
    }
  }

  if (matchingLines.length > 0) {
    return matchingLines.join('\n');
  }

  return '';
}

/**
 * Query RAG Knowledge Base — main entry point for chat engine.
 * FAQ priority: check FAQ first, then fallback to full document search.
 * Returns RagQueryResult or null.
 */
export async function queryRagKnowledgeBase(userQuery: string, apiKey?: string): Promise<RagQueryResult | null> {
  if (!userQuery?.trim()) return null;

  try {
    // Priority 1: FAQ exact/high-priority match
    const faqResults = await retrieveRagContext(userQuery, 3, true, apiKey);
    const topFaq = faqResults.find(r => r.similarity > 0.7 && r.answer);
    if (topFaq && topFaq.answer) {
      return {
        contextForLlm: `FAQ: ${topFaq.question || userQuery}\nJawaban: ${topFaq.answer}`,
        conciseFallback: topFaq.answer,
        isFaq: true,
      };
    }

    // Priority 2: Full RAG document search (top-5)
    const docResults = await retrieveRagContext(userQuery, 5, false, apiKey);
    if (docResults.length === 0) return null;

    const relevant = docResults.filter(r => r.similarity > 0.05);
    const finalDocs = relevant.length > 0 ? relevant : docResults.slice(0, 3);
    if (finalDocs.length === 0) return null;

    // Check if best match is a FAQ
    if (finalDocs[0].answer && finalDocs[0].similarity > 0.6) {
      return {
        contextForLlm: `FAQ: ${finalDocs[0].question || userQuery}\nJawaban: ${finalDocs[0].answer}`,
        conciseFallback: finalDocs[0].answer,
        isFaq: true,
      };
    }

    // Clean context for LLM prompt injection (no technical header tags)
    const contextParts = finalDocs.map((r) => {
      const headingText = r.heading ? `[${r.heading}]\n` : '';
      return `${headingText}${r.content}`;
    });

    const contextForLlm = contextParts.join('\n\n');

    // Concise fallback for offline mode (skip cover/header chunks, find real content)
    let contentChunk = finalDocs.find(d => !d.content.includes('DATA OPERASIONAL UMUM') && d.content.length > 50) || finalDocs[0];
    const isDefQuery = /apa itu|maksud|pengertian|arti|definisi/i.test(userQuery);
    if (isDefQuery) {
      const defDoc = finalDocs.find(d => (d.heading && d.heading.toLowerCase().includes('profil')) || d.content.includes('LSP Badan Sertifikasi Manajemen Risiko'));
      if (defDoc) contentChunk = defDoc;
    }
    const conciseFallback = extractConciseSnippet(contentChunk.content, userQuery);

    return {
      contextForLlm,
      conciseFallback,
      isFaq: false,
    };
  } catch (e) {
    console.warn('[RAG] Server retrieval failed:', e);
    return null;
  }
}
