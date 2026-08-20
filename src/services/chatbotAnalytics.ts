// Analytics Service for BSMR Chatbot KPI Metrics

export interface ChatbotAnalytics {
  totalInteractions: number; // KPI 1: Total Sesi Interaksi Pengunjung
  solvedCount: number;       // KPI 2: Pertanyaan Tuntas dijawab AI (Feedback 'Ya')
  unsolvedCount: number;     // Feedback 'Tidak'
  escalatedCount: number;    // KPI 3: Eskalasi ke CS Admin
  outOfHoursCount: number;   // KPI 4: Interaksi Luar Jam Kerja (>17:00 / Weekend)
  monthlyGrowth: number;     // Pertumbuhan vs bulan lalu
  lastUpdated: string;
}

const STORAGE_KEY = 'bsmr_chatbot_analytics';

export const DEFAULT_ANALYTICS: ChatbotAnalytics = {
  totalInteractions: 1420,
  solvedCount: 1338,
  unsolvedCount: 82,
  escalatedCount: 82,
  outOfHoursCount: 604,
  monthlyGrowth: 220,
  lastUpdated: new Date().toISOString(),
};

/**
 * Mendapatkan data analitik terkini dari localStorage
 */
export function getChatbotAnalytics(): ChatbotAnalytics {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_ANALYTICS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load chatbot analytics:', e);
  }
  return DEFAULT_ANALYTICS;
}

/**
 * Menyimpan data analitik ke localStorage
 */
export function saveChatbotAnalytics(analytics: ChatbotAnalytics): void {
  try {
    analytics.lastUpdated = new Date().toISOString();
    localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new Event('bsmr_analytics_updated'));
  } catch (e) {
    console.error('Failed to save chatbot analytics:', e);
  }
}

/**
 * Memeriksa apakah waktu saat ini di luar jam kerja (Senin-Jumat > 17:00/ < 08:00, atau Sabtu & Minggu)
 */
export function isOutOfWorkingHours(date = new Date()): boolean {
  const day = date.getDay(); // 0: Sunday, 6: Saturday
  const hour = date.getHours();
  // Weekend
  if (day === 0 || day === 6) return true;
  // Out of 08:00 - 17:00
  if (hour >= 17 || hour < 8) return true;
  return false;
}

/**
 * KPI 1 & KPI 4: Catat Interaksi Pengunjung Baru
 */
export function recordNewInteraction(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  current.totalInteractions += 1;

  // KPI 4: Jika di luar jam kerja
  if (isOutOfWorkingHours()) {
    current.outOfHoursCount += 1;
  }

  saveChatbotAnalytics(current);
  return current;
}

/**
 * KPI 2: Catat Penyelesaian Mandiri AI (Feedback "Ya")
 */
export function recordSelfServiceResolved(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  current.solvedCount += 1;
  saveChatbotAnalytics(current);
  return current;
}

/**
 * KPI 3: Catat Eskalasi ke CS Admin ("Mengobrol Dengan Admin")
 */
export function recordAdminEscalation(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  current.escalatedCount += 1;
  saveChatbotAnalytics(current);
  return current;
}
