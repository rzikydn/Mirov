// Intent Categorization & Analytics Service for BSMR Top Questions Donut Chart

export interface QuestionCategory {
  id: string;
  label: string;
  count: number;
  color: string;
  keywords: string[];
}

const STORAGE_KEY = 'bsmr_top_questions_analytics';

export const DEFAULT_TOP_QUESTIONS: QuestionCategory[] = [
  {
    id: "jadwal-asesmen",
    label: "Jadwal Asesmen Level 2",
    count: 420,
    color: "hsl(214.7 95% 40%)", // Blue
    keywords: ["jadwal", "kapan", "asesmen", "ujian", "level 2", "tanggal", "periode", "lokasi"],
  },
  {
    id: "mekanisme-perpanjangan",
    label: "Mekanisme Perpanjangan",
    count: 310,
    color: "hsl(142.1 76.2% 36.3%)", // Green
    keywords: ["perpanjang", "perpanjangan", "expired", "habis", "mekanisme", "re-sertifikasi", "renew", "masa berlaku"],
  },
  {
    id: "rincian-biaya",
    label: "Rincian Biaya Sertifikasi",
    count: 240,
    color: "hsl(47.9 95.8% 53.1%)", // Yellow
    keywords: ["biaya", "harga", "tarif", "bayar", "rincian", "ppn", "biaya sertifikasi", "rekening"],
  },
  {
    id: "skp-maintenance",
    label: "Syarat Poin SKP Maintenance",
    count: 180,
    color: "hsl(262.1 83.3% 57.8%)", // Purple
    keywords: ["skp", "poin", "kredit", "maintenance", "pemeliharaan", "syarat poin"],
  },
  {
    id: "persyaratan-asesi",
    label: "Persyaratan Asesi Umum",
    count: 120,
    color: "hsl(0 0% 63.9%)", // Gray
    keywords: ["syarat", "persyaratan", "berkas", "dokumen", "umum", "kualifikasi", "pendaftaran"],
  },
];

/**
 * Membaca data Top Pertanyaan dari localStorage
 */
export function getTopQuestionsData(): QuestionCategory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load top questions analytics:', e);
  }
  return DEFAULT_TOP_QUESTIONS;
}

/**
 * Menyimpan data Top Pertanyaan ke localStorage
 */
export function saveTopQuestionsData(categories: QuestionCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('bsmr_top_questions_updated'));
  } catch (e) {
    console.error('Failed to save top questions analytics:', e);
  }
}

/**
 * Klasifikasi pertanyaan pengguna berdasarkan intent/kata kunci dan perbarui frekuensi Top 5
 */
export function classifyAndRecordQuestion(userQuestion: string): void {
  if (!userQuestion || !userQuestion.trim()) return;
  const text = userQuestion.toLowerCase().trim();

  const categories = getTopQuestionsData();
  let bestMatchIndex = -1;
  let highestScore = 0;

  categories.forEach((cat, index) => {
    let score = 0;
    cat.keywords.forEach((keyword) => {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    if (score > highestScore) {
      highestScore = score;
      bestMatchIndex = index;
    }
  });

  // Jika cocok dengan salah satu kategori populer, tambahkan jumlah frekuensinya
  if (bestMatchIndex !== -1 && highestScore > 0) {
    categories[bestMatchIndex].count += 1;
  } else {
    // Jika pertanyaan baru unik yang belum masuk 5 besar, tambahkan ke kategori umum atau kategori acak terdekat
    // Default tambahkan ke kategori pertama (Jadwal/Informasi Umum)
    categories[0].count += 1;
  }

  // Urutkan kembali berdasarkan jumlah pertanyaan terbanyak (Descending)
  categories.sort((a, b) => b.count - a.count);

  saveTopQuestionsData(categories);
}
