// Intent Categorization & Analytics Service (Driven Directly by Active Chat Logs)
import { getVisitorChatSessions, ChatSession } from "./visitorChatLogsService";

export interface QuestionCategory {
  id: string;
  label: string;
  count: number;
  color: string;
  keywords: string[];
}

export const DEFAULT_TOP_QUESTIONS: QuestionCategory[] = [
  {
    id: "jadwal-asesmen",
    label: "Jadwal & Lokasi Asesmen",
    count: 0,
    color: "hsl(214.7 95% 40%)", // Blue
    keywords: ["jadwal", "kapan", "asesmen", "ujian", "level", "tanggal", "periode", "lokasi", "tempat", "cbt"],
  },
  {
    id: "perpanjangan-sertifikat",
    label: "Mekanisme Perpanjangan",
    count: 0,
    color: "hsl(142.1 76.2% 36.3%)", // Green
    keywords: ["perpanjang", "perpanjangan", "expired", "habis", "mekanisme", "re-sertifikasi", "renew", "masa berlaku", "tenggat"],
  },
  {
    id: "biaya-pendaftaran",
    label: "Rincian Biaya & Pendaftaran",
    count: 0,
    color: "hsl(47.9 95.8% 53.1%)", // Yellow
    keywords: ["biaya", "harga", "tarif", "bayar", "rincian", "ppn", "daftar", "pendaftaran", "rekening", "registrasi"],
  },
  {
    id: "skp-maintenance",
    label: "Syarat Poin SKP Maintenance",
    count: 0,
    color: "hsl(262.1 83.3% 57.8%)", // Purple
    keywords: ["skp", "poin", "kredit", "maintenance", "pemeliharaan", "syarat poin", "kredit poin"],
  },
  {
    id: "persyaratan-berkas",
    label: "Persyaratan & Dokumen",
    count: 0,
    color: "hsl(0 0% 63.9%)", // Gray
    keywords: ["syarat", "persyaratan", "berkas", "dokumen", "umum", "kualifikasi", "ijazah", "ktp", "pas foto"],
  },
  {
    id: "informasi-bsmr",
    label: "Informasi Umum BSMR",
    count: 0,
    color: "hsl(198 93% 60%)", // Cyan
    keywords: ["apa itu", "bsmr", "lembaga", "ojk", "bnsp", "profil", "tentang"],
  },
  {
    id: "eskalasi-admin",
    label: "Eskalasi CS Admin",
    count: 0,
    color: "hsl(340 82% 52%)", // Rose
    keywords: ["admin", "cs", "obrol", "mengobrol", "hubungi", "operator", "bantuan", "pesan"],
  },
  {
    id: "di-luar-konteks",
    label: "Di Luar Konteks / Lainnya",
    count: 0,
    color: "hsl(215 16% 47%)", // Slate Gray
    keywords: [],
  },
];

/**
 * Computes Top Questions categories directly derived from active, non-deleted chat logs
 */
export function computeTopQuestionsFromSessions(sessions: ChatSession[]): QuestionCategory[] {
  const categories: QuestionCategory[] = DEFAULT_TOP_QUESTIONS.map((cat) => ({
    ...cat,
    count: 0,
  }));

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return categories;
  }

  for (const session of sessions) {
    if (!session || !Array.isArray(session.messages)) continue;
    for (const msg of session.messages) {
      if (msg && msg.sender === "user" && msg.text) {
        const text = msg.text.toLowerCase().trim();
        let bestIdx = -1;
        let highestScore = 0;

        categories.forEach((cat, idx) => {
          if (cat.keywords.length === 0) return;
          let score = 0;
          cat.keywords.forEach((kw) => {
            if (text.includes(kw.toLowerCase())) {
              score += 1;
            }
          });
          if (score > highestScore) {
            highestScore = score;
            bestIdx = idx;
          }
        });

        if (bestIdx !== -1 && highestScore > 0) {
          categories[bestIdx].count += 1;
        } else {
          const outOfContextIdx = categories.findIndex((c) => c.id === "di-luar-konteks");
          if (outOfContextIdx >= 0) categories[outOfContextIdx].count += 1;
          else categories[0].count += 1;
        }
      }
    }
  }

  categories.sort((a, b) => b.count - a.count);
  return categories;
}

export function getTopQuestionsData(): QuestionCategory[] {
  const sessions = getVisitorChatSessions();
  return computeTopQuestionsFromSessions(sessions);
}

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
const SYNC_API_URL = import.meta.env.DEV ? '/api/top-questions' : (API_BASE ? `${API_BASE}/api/top-questions` : '');

export async function fetchTopQuestionsAsync(): Promise<QuestionCategory[]> {
  if (!SYNC_API_URL) {
    return getTopQuestionsData();
  }
  try {
    const cacheBustUrl = `${SYNC_API_URL}?_t=${Date.now()}`;
    const res = await fetch(cacheBustUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {}
  return getTopQuestionsData();
}

export function saveTopQuestionsData(categories?: QuestionCategory[]): void {
  const data = categories || getTopQuestionsData();
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("bsmr_top_questions_updated", { detail: data }));
      window.dispatchEvent(new Event("bsmr_top_questions_updated"));
    } catch (e) {}

    try {
      window.postMessage({ type: "BSMR_TOP_QUESTIONS_UPDATED", categories: data }, "*");
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "BSMR_TOP_QUESTIONS_UPDATED", categories: data }, "*");
      }
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage({ type: "BSMR_TOP_QUESTIONS_UPDATED", categories: data }, "*");
        } catch (e) {}
      });
    } catch (e) {}

    if ("BroadcastChannel" in window) {
      try {
        const c1 = new BroadcastChannel("bsmr_chat_sync_channel");
        c1.postMessage({ type: "TOP_QUESTIONS_UPDATED", categories: data });
        c1.close();

        const c2 = new BroadcastChannel("bsmr_top_questions_sync");
        c2.postMessage({ type: "TOP_QUESTIONS_UPDATED", categories: data });
        c2.close();
      } catch (e) {}
    }
  }
}

export function classifyAndRecordQuestion(userQuestion?: string): void {
  const fresh = getTopQuestionsData();
  saveTopQuestionsData(fresh);
}
