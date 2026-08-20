// RAG Vector Knowledge Base & Retrieval Service for BSMR Chatbot

export interface RagKnowledgeItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'TXT' | 'FAQ';
  content: string; // Extracted raw text or Q&A
  category?: string;
  size?: string;
  status: 'Indexed' | 'Processing';
  createdAt: string;
  question?: string;
  answer?: string;
}

const STORAGE_KEY = 'bsmr_rag_knowledge_base';

export const INITIAL_RAG_ITEMS: RagKnowledgeItem[] = [
  {
    id: "silabus-bsmr-pdf",
    title: "Silabus-Sertifikasi-BSMR-2026.pdf",
    type: "PDF",
    content: "Silabus Sertifikasi BSMR 2026 mencakup 5 Level Kompetensi Manajemen Risiko Perbankan. Level 1 mencakup dasar-dasar manajemen risiko operasional, pasar, dan kredit. Ujian terdiri dari 100 soal pilihan ganda dengan passing grade 70%.",
    category: "Silabus",
    size: "1.8 MB",
    status: "Indexed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "panduan-perpanjangan-doc",
    title: "Panduan-Perpanjangan-Sertifikat.docx",
    type: "DOCX",
    content: "Mekanisme perpanjangan sertifikat BSMR berlaku setiap 3 tahun sekali. Pemegang sertifikat harus mengumpulkan minimal 50 Poin SKP (Satuan Kredit Partisipasi) melalui pelatihan, seminar, atau asesmen pemeliharaan sebelum tanggal kedaluwarsa.",
    category: "Panduan",
    size: "840 KB",
    status: "Indexed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "faq-default-1",
    title: "FAQ-Biaya Ujian",
    type: "FAQ",
    question: "Berapa biaya ujian sertifikasi BSMR?",
    answer: "Biaya Ujian Sertifikasi BSMR Level 1 adalah Rp 2.500.000,- dan Level 2 adalah Rp 4.500.000,-. Biaya perpanjangan sertifikat melalui jalur SKP adalah Rp 1.200.000,- (belum termasuk PPN 11%).",
    content: "Biaya Ujian Sertifikasi BSMR Level 1 adalah Rp 2.500.000,- dan Level 2 adalah Rp 4.500.000,-. Biaya perpanjangan sertifikat melalui jalur SKP adalah Rp 1.200.000,- (belum termasuk PPN 11%).",
    category: "Biaya & Administrasi",
    size: "12 KB",
    status: "Indexed",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Membaca data RAG Knowledge Base dari localStorage
 */
export function getRagKnowledgeBase(): RagKnowledgeItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load RAG Knowledge Base:', e);
  }
  return INITIAL_RAG_ITEMS;
}

/**
 * Menyimpan data RAG Knowledge Base ke localStorage
 */
export function saveRagKnowledgeBase(items: RagKnowledgeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('bsmr_rag_updated'));
  } catch (e) {
    console.error('Failed to save RAG Knowledge Base:', e);
  }
}

/**
 * Menambahkan dokumen/file atau FAQ baru ke dalam RAG Vector Knowledge Base
 */
export function addRagItem(newItem: RagKnowledgeItem): void {
  const current = getRagKnowledgeBase();
  const updated = [newItem, ...current];
  saveRagKnowledgeBase(updated);
}

/**
 * Menghapus dokumen/file RAG dari Vector Knowledge Base
 */
export function removeRagItem(id: string): void {
  const current = getRagKnowledgeBase();
  const updated = current.filter((item) => item.id !== id);
  saveRagKnowledgeBase(updated);
}

/**
 * RAG Retrieval Engine: Mencari jawaban spesifik dari dokumen file upload & FAQ
 */
export function queryRagKnowledgeBase(userQuery: string): string | null {
  if (!userQuery || !userQuery.trim()) return null;
  const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return null;

  const items = getRagKnowledgeBase();
  let bestMatch: RagKnowledgeItem | null = null;
  let highestScore = 0;

  items.forEach((item) => {
    let score = 0;
    const targetText = `${item.title} ${item.category || ''} ${item.question || ''} ${item.content} ${item.answer || ''}`.toLowerCase();

    queryWords.forEach((word) => {
      if (targetText.includes(word)) {
        score += 1;
      }
    });

    // Bonus jika pertanyaan FAQ sangat cocok
    if (item.question && userQuery.toLowerCase().includes(item.question.toLowerCase().slice(0, 10))) {
      score += 3;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  });

  // Jika skor pencarian memenuhi ambang batas relevansi (skor >= 1)
  if (bestMatch && highestScore >= 1) {
    if (bestMatch.type === 'FAQ' && bestMatch.answer) {
      return `[Berdasarkan FAQ Resmi BSMR]\n${bestMatch.answer}`;
    }
    return `[Berdasarkan Dokumen RAG: "${bestMatch.title}"]\n${bestMatch.content}`;
  }

  return null;
}
