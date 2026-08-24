// FAQ Settings Service for Real-Time Synchronization of Quick Action Pills and Q&A Knowledge

export interface FaqItem {
  id: string;
  label: string;
  icon: string;
  answer: string;
  category?: string;
}

const STORAGE_KEY = 'mirov_chatbot_faqs';
const FAQ_API_URL = 'http://localhost:5173/api/chatbot-faqs';

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "cek-sertifikat",
    label: "Cek Masa Berlaku Sertifikat",
    icon: "🔍",
    answer: "Untuk mengecek masa berlaku Sertifikat BSMR Anda, silakan ketikkan Nomor Sertifikat atau Tanggal/Tahun diterbitkannya sertifikat Anda (Contoh: 12/05/2023).",
    category: "Sertifikasi",
  },
  {
    id: "apa-bsmr",
    label: "Apa itu BSMR?",
    icon: "📜",
    answer: "LSP BSMR (Badan Sertifikasi Manajemen Risiko) adalah lembaga sertifikasi profesi resmi di Indonesia yang menguji dan menerbitkan sertifikasi kompetensi manajemen risiko perbankan sesuai standar OJK dan BNSP.",
    category: "Umum",
  },
  {
    id: "level-sertifikasi",
    label: "Level Sertifikasi",
    icon: "📊",
    answer: "BSMR menyelenggarakan sertifikasi Manajemen Risiko dari Level 1 (Tingkat Dasar/Staff) hingga Level 5 (Tingkat Eksekutif/Direksi).",
    category: "Sertifikasi",
  },
  {
    id: "cara-daftar",
    label: "Cara Pendaftaran",
    icon: "📝",
    answer: "Pendaftaran ujian dapat dilakukan secara online melalui portal bsmr.org pada menu 'Pendaftaran Ujian' atau melalui PIC Bank pengirim.",
    category: "Pendaftaran",
  },
  {
    id: "jadwal-lokasi",
    label: "Jadwal & Lokasi",
    icon: "📅",
    answer: "Jadwal Asesmen BSMR terdekat dilaksanakan pada 12-14 September 2026 secara Hybrid (Online via Computer Based Test & Offline di Kampus BSMR Jakarta).",
    category: "Jadwal",
  },
  {
    id: "hubungi-bsmr",
    label: "Hubungi BSMR",
    icon: "📞",
    answer: "Anda dapat menghubungi Admin CS BSMR via WhatsApp atau Email resmi.",
    category: "Umum",
  },
];

/**
 * Membaca daftar FAQ dari localStorage secara sinkron
 */
export function getFaqList(): FaqItem[] {
  try {
    const data = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load FAQ list:', e);
  }
  return DEFAULT_FAQS;
}

/**
 * Fetch daftar FAQ dari Vite API server secara asinkron (untuk cross-domain / iframe)
 */
export async function fetchFaqListAsync(): Promise<FaqItem[]> {
  try {
    const res = await fetch(`${FAQ_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          window.dispatchEvent(new Event('bsmr_faqs_updated'));
        }
        return data;
      }
    }
  } catch (e) {
    // Fallback silent
  }
  return getFaqList();
}

/**
 * Menyimpan seluruh daftar FAQ baru dan menyebarkannya via Event, PostMessage, BroadcastChannel, dan HTTP API
 */
export function saveFaqList(faqs: FaqItem[]): void {
  try {
    const cleaned = Array.isArray(faqs) ? faqs : DEFAULT_FAQS;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      window.dispatchEvent(new Event('bsmr_faqs_updated'));
      window.dispatchEvent(new CustomEvent('bsmr_faqs_updated_detail', { detail: cleaned }));

      // Broadcast ke parent/iframe
      window.postMessage({ type: 'BSMR_FAQS_UPDATED', faqs: cleaned }, '*');

      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage({ type: 'BSMR_FAQS_UPDATED', faqs: cleaned }, '*');
        } catch (e) {}
      });

      // BroadcastChannel untuk tab lain
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_chat_sync_channel');
          channel.postMessage({ type: 'FAQS_UPDATED', faqs: cleaned });
          channel.close();
        } catch (e) {}
      }
    }

    // HTTP POST Sync ke server Vite API
    fetch(FAQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save FAQs:', e);
  }
}

/**
 * Menambahkan atau memperbarui item FAQ
 */
export function upsertFaqItem(item: FaqItem): FaqItem[] {
  const current = getFaqList();
  const index = current.findIndex((f) => f.id === item.id);
  let updated: FaqItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = item;
  } else {
    updated = [...current, item];
  }
  saveFaqList(updated);
  return updated;
}

/**
 * Menghapus FAQ berdasarkan id
 */
export function deleteFaqItem(id: string): FaqItem[] {
  const current = getFaqList();
  const updated = current.filter((f) => f.id !== id);
  saveFaqList(updated);
  return updated;
}

/**
 * Reset FAQ ke susunan default
 */
export function resetFaqToDefault(): FaqItem[] {
  saveFaqList(DEFAULT_FAQS);
  return DEFAULT_FAQS;
}
