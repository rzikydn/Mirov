// Peak Hours 24-Hour Analytics Service for BSMR Chatbot (Driven Directly by Active Chat Logs)
import { getVisitorChatSessions, ChatSession } from "./visitorChatLogsService";

export interface PeakHourBucket {
  hour: string;
  chat: number;
  capacity: number;
}

export const INITIAL_PEAK_HOURS: PeakHourBucket[] = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  chat: 0,
  capacity: 80,
}));

function parseHourFromMessage(msg: any, session: ChatSession): number {
  if (msg && msg.time) {
    const match = msg.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const isPM = match[3] && match[3].toUpperCase() === 'PM';
      const isAM = match[3] && match[3].toUpperCase() === 'AM';
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (h >= 0 && h <= 23) return h;
    }
  }
  if (session && session.timestamp) {
    return new Date(session.timestamp).getHours();
  }
  return new Date().getHours();
}

/**
 * Computes peak hours 24-hour buckets directly derived from active, non-deleted chat logs
 */
export function computePeakHoursFromSessions(sessions: ChatSession[]): PeakHourBucket[] {
  const buckets: PeakHourBucket[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    chat: 0,
    capacity: 80,
  }));

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return buckets;
  }

  for (const session of sessions) {
    if (!session || !Array.isArray(session.messages)) continue;
    for (const m of session.messages) {
      if (m && m.sender === 'user') {
        const hour = parseHourFromMessage(m, session);
        if (hour >= 0 && hour < 24) {
          buckets[hour].chat += 1;
        }
      }
    }
  }

  return buckets;
}

/**
 * Membaca data jam sibuk yang dihitung secara dinamis dari active Chat Logs
 */
export function getPeakHoursData(): PeakHourBucket[] {
  const sessions = getVisitorChatSessions();
  return computePeakHoursFromSessions(sessions);
}

const SYNC_API_URL = 'http://localhost:5173/api/peak-hours';

/**
 * Fetch data peak hours dari API Server secara async
 */
export async function fetchPeakHoursAsync(): Promise<PeakHourBucket[]> {
  try {
    const cacheBustUrl = `${SYNC_API_URL}?_t=${Date.now()}`;
    const res = await fetch(cacheBustUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length === 24) {
        return data.map((b: any) => ({ ...b, capacity: 80 }));
      }
    }
  } catch (e) {}
  return getPeakHoursData();
}

export function savePeakHoursData(data: PeakHourBucket[]): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
  }
}

export function recordPeakHourChat(date = new Date()): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
  }
}
