// Analytics Service for BSMR Chatbot KPI Metrics
import { getVisitorChatSessions, ChatSession } from './visitorChatLogsService';

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
  totalInteractions: 0,
  solvedCount: 0,
  unsolvedCount: 0,
  escalatedCount: 0,
  outOfHoursCount: 0,
  monthlyGrowth: 0,
  lastUpdated: new Date().toISOString(),
};

export function extractDateFromSession(s: ChatSession): Date {
  if (!s) return new Date();
  if (s.timestamp && typeof s.timestamp === 'number' && !isNaN(s.timestamp) && s.timestamp > 0) {
    return new Date(s.timestamp);
  }
  if (s.id && typeof s.id === 'string' && s.id.includes('-')) {
    const parts = s.id.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > 1000000000000) {
      return new Date(num);
    }
  }
  if (s.time) {
    const timeMatch = s.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      if (today.getTime() > Date.now() + 60000) {
        today.setDate(today.getDate() - 1);
      }
      return today;
    }
  }
  return new Date();
}

/**
 * Mendapatkan data analitik terkini yang disinkronkan secara langsung dari real session logs
 */
export function getChatbotAnalytics(): ChatbotAnalytics {
  try {
    const sessions = getVisitorChatSessions();
    const realSessionCount = Array.isArray(sessions) ? sessions.length : 0;
    const realEscalatedCount = Array.isArray(sessions)
      ? sessions.filter(
          (s) =>
            !s.satisfied ||
            s.summary?.toLowerCase().includes('admin') ||
            s.statusText?.toLowerCase().includes('admin') ||
            s.messages?.some((m) => m.text?.toLowerCase().includes('mengobrol dengan admin'))
        ).length
      : 0;

    const realSolvedCount = Math.max(0, realSessionCount - realEscalatedCount);

    const realOutOfHoursCount = Array.isArray(sessions)
      ? sessions.filter((s) => {
          const sessionDate = extractDateFromSession(s);
          return isOutOfWorkingHours(sessionDate);
        }).length
      : 0;

    const data = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    let parsed: any = {};
    if (data) {
      try {
        parsed = JSON.parse(data);
      } catch (e) {}
    }

    const updatedAnalytics: ChatbotAnalytics = {
      ...DEFAULT_ANALYTICS,
      ...parsed,
      totalInteractions: realSessionCount,
      monthlyGrowth: realSessionCount,
      solvedCount: realSolvedCount,
      escalatedCount: realEscalatedCount,
      outOfHoursCount: realOutOfHoursCount,
      lastUpdated: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && (parsed.outOfHoursCount !== realOutOfHoursCount || parsed.totalInteractions !== realSessionCount)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAnalytics));
    }

    return updatedAnalytics;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
      window.dispatchEvent(new Event('bsmr_analytics_updated'));

      window.postMessage({ type: 'BSMR_ANALYTICS_UPDATED', analytics }, '*');
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'BSMR_ANALYTICS_UPDATED', analytics }, '*');
      }

      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_analytics_sync_channel');
          channel.postMessage({ type: 'BSMR_ANALYTICS_UPDATED', analytics });
          channel.close();
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Failed to save chatbot analytics:', e);
  }
}

/**
 * Memeriksa apakah waktu saat ini di luar jam kerja (Senin-Jumat > 17:00 / < 08:00, Weekend Sabtu & Minggu, atau Libur Nasional)
 */
export function isOutOfWorkingHours(date = new Date()): boolean {
  const day = date.getDay(); // 0: Sunday, 6: Saturday
  const hour = date.getHours();

  // 1. Weekend (Sabtu & Minggu)
  if (day === 0 || day === 6) return true;

  // 2. Di luar jam 08:00 - 17:00 WIB (Senin - Jumat)
  if (hour >= 17 || hour < 8) return true;

  // 3. Libur Nasional Indonesia (Format MM-DD)
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const indonesianNationalHolidays = [
    '01-01', // Tahun Baru Masehi
    '05-01', // Hari Buruh Internasional
    '06-01', // Hari Lahir Pancasila
    '08-17', // Hari Kemerdekaan RI
    '12-25', // Hari Raya Natal
    '12-26', // Cuti Bersama Natal
  ];

  if (indonesianNationalHolidays.includes(monthDay)) return true;

  return false;
}

/**
 * KPI 1 & KPI 4: Catat Interaksi Pengunjung Baru
 */
export function recordNewInteraction(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  saveChatbotAnalytics(current);
  return current;
}

/**
 * KPI 2: Catat Penyelesaian Mandiri AI (Feedback "Ya")
 */
export function recordSelfServiceResolved(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  saveChatbotAnalytics(current);
  return current;
}

/**
 * KPI 3: Catat Eskalasi ke CS Admin ("Mengobrol Dengan Admin")
 */
export function recordAdminEscalation(): ChatbotAnalytics {
  const current = getChatbotAnalytics();
  saveChatbotAnalytics(current);
  return current;
}

