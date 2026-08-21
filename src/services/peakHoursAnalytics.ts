// Peak Hours 24-Hour Analytics Service for BSMR Chatbot (Real-Time 24-Hour Analytics)

export interface PeakHourBucket {
  hour: string;
  chat: number;
  capacity: number;
}

const STORAGE_KEY = 'bsmr_peak_hours_analytics';
const DATE_STORAGE_KEY = 'bsmr_peak_hours_last_date';
const DUMMY_CLEARED_KEY = 'bsmr_peak_hours_dummy_purged_v2';
const SYNC_API_URL = 'http://localhost:5173/api/peak-hours';

// Clean 24-Hour Initial Buckets (00:00 to 23:00) with 0 chat interactions
export const INITIAL_PEAK_HOURS: PeakHourBucket[] = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  chat: 0,
  capacity: 80,
}));

let cachedPeakHours: PeakHourBucket[] = [...INITIAL_PEAK_HOURS];

/**
 * Purge legacy dummy data once on initial upgrade to give user a clean slate for real-time testing
 */
function purgeLegacyDummyData(): void {
  try {
    if (typeof window === 'undefined') return;
    const isPurged = localStorage.getItem(DUMMY_CLEARED_KEY);
    if (!isPurged) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PEAK_HOURS));
      localStorage.setItem(DUMMY_CLEARED_KEY, 'true');
    }
  } catch (e) {}
}

/**
 * Memeriksa dan mereset data chart Peak Hours secara otomatis saat berganti hari/tanggal baru
 */
export function checkAndResetPeakHoursNewDay(): void {
  try {
    purgeLegacyDummyData();
    const todayStr = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const lastSavedDate = typeof window !== 'undefined' ? localStorage.getItem(DATE_STORAGE_KEY) : null;

    if (lastSavedDate && lastSavedDate !== todayStr) {
      const resetBuckets: PeakHourBucket[] = INITIAL_PEAK_HOURS.map((bucket) => ({
        ...bucket,
        chat: 0,
      }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resetBuckets));
        localStorage.setItem(DATE_STORAGE_KEY, todayStr);
        window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
      }
      cachedPeakHours = resetBuckets;
    } else if (!lastSavedDate && typeof window !== 'undefined') {
      localStorage.setItem(DATE_STORAGE_KEY, todayStr);
    }
  } catch (e) {
    console.error('Failed to check peak hours new day reset:', e);
  }
}

/**
 * Membaca data jam sibuk dari localStorage
 */
export function getPeakHoursData(): PeakHourBucket[] {
  checkAndResetPeakHoursNewDay();
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length === 24) {
          const sanitized = parsed.map(b => ({ ...b, capacity: 80 }));
          cachedPeakHours = sanitized;
          return sanitized;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load peak hours analytics:', e);
  }
  return cachedPeakHours.length === 24 ? cachedPeakHours.map(b => ({ ...b, capacity: 80 })) : INITIAL_PEAK_HOURS;
}

/**
 * Fetch data peak hours dari API Server secara async (Cross-Origin Support)
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
        const sanitized = data.map((b: any) => ({ ...b, capacity: 80 }));
        cachedPeakHours = sanitized;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
        }
        return sanitized;
      }
    }
  } catch (e) {
    // Silently fallback
  }
  return getPeakHoursData();
}

/**
 * Menyimpan data jam sibuk ke localStorage dan Sync ke Server API
 */
export function savePeakHoursData(data: PeakHourBucket[]): void {
  try {
    if (!Array.isArray(data) || data.length !== 24) return;
    const sanitized = data.map(b => ({ ...b, capacity: 80 }));
    cachedPeakHours = sanitized;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new Event('bsmr_peak_hours_updated'));

      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_peak_hours_sync');
          channel.postMessage({ type: 'PEAK_HOURS_UPDATED', data: sanitized });
          channel.close();
        } catch (e) {}
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'BSMR_PEAK_HOURS_UPDATED', data: sanitized }, '*');
      }
    }

    // HTTP Sync POST ke Vite API
    fetch(SYNC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save peak hours analytics:', e);
  }
}

/**
 * Catat interaksi pesan pengguna berdasarkan jam saat ini (00:00 s.d. 23:00)
 */
export function recordPeakHourChat(date = new Date()): void {
  checkAndResetPeakHoursNewDay();
  const currentHour = date.getHours(); // 0 - 23
  const data = getPeakHoursData();
  
  if (Array.isArray(data) && data[currentHour]) {
    const updated = [...data];
    updated[currentHour] = {
      ...updated[currentHour],
      chat: (updated[currentHour].chat || 0) + 1,
    };
    savePeakHoursData(updated);
  }
}
