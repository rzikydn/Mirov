// Peak Hours 24-Hour Analytics Service for BSMR Chatbot (with New Day Auto-Reset)

export interface PeakHourBucket {
  hour: string;
  chat: number;
  capacity: number;
}

const STORAGE_KEY = 'bsmr_peak_hours_analytics';
const DATE_STORAGE_KEY = 'bsmr_peak_hours_last_date';

export const INITIAL_PEAK_HOURS: PeakHourBucket[] = [
  { hour: "00:00", chat: 32, capacity: 150 },
  { hour: "01:00", chat: 18, capacity: 150 },
  { hour: "02:00", chat: 12, capacity: 150 },
  { hour: "03:00", chat: 8, capacity: 150 },
  { hour: "04:00", chat: 15, capacity: 150 },
  { hour: "05:00", chat: 25, capacity: 150 },
  { hour: "06:00", chat: 42, capacity: 150 },
  { hour: "07:00", chat: 65, capacity: 150 },
  { hour: "08:00", chat: 110, capacity: 150 },
  { hour: "09:00", chat: 168, capacity: 150 },
  { hour: "10:00", chat: 195, capacity: 150 },
  { hour: "11:00", chat: 140, capacity: 150 },
  { hour: "12:00", chat: 98, capacity: 150 },
  { hour: "13:00", chat: 175, capacity: 150 },
  { hour: "14:00", chat: 242, capacity: 150 },
  { hour: "15:00", chat: 210, capacity: 150 },
  { hour: "16:00", chat: 165, capacity: 150 },
  { hour: "17:00", chat: 125, capacity: 150 },
  { hour: "18:00", chat: 82, capacity: 150 },
  { hour: "19:00", chat: 115, capacity: 150 },
  { hour: "20:00", chat: 148, capacity: 150 },
  { hour: "21:00", chat: 120, capacity: 150 },
  { hour: "22:00", chat: 90, capacity: 150 },
  { hour: "23:00", chat: 55, capacity: 150 },
];

/**
 * Memeriksa dan mereset data chart Peak Hours secara otomatis saat berganti hari/tanggal baru
 */
export function checkAndResetPeakHoursNewDay(): void {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const lastSavedDate = localStorage.getItem(DATE_STORAGE_KEY);

    if (lastSavedDate && lastSavedDate !== todayStr) {
      // Memasuki hari/tanggal baru! Reset seluruh 24 jam interaksi menjadi 0
      const resetBuckets: PeakHourBucket[] = INITIAL_PEAK_HOURS.map((bucket) => ({
        ...bucket,
        chat: 0,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetBuckets));
      localStorage.setItem(DATE_STORAGE_KEY, todayStr);
      window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
    } else if (!lastSavedDate) {
      localStorage.setItem(DATE_STORAGE_KEY, todayStr);
    }
  } catch (e) {
    console.error('Failed to check peak hours new day reset:', e);
  }
}

/**
 * Membaca data jam sibuk dari localStorage dengan validasi Array ketat & Auto-Reset Hari Baru
 */
export function getPeakHoursData(): PeakHourBucket[] {
  checkAndResetPeakHoursNewDay();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const totalChat = parsed.reduce((acc: number, item: any) => acc + (item.chat || 0), 0);
        if (totalChat > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load peak hours analytics:', e);
  }
  return INITIAL_PEAK_HOURS;
}

/**
 * Menyimpan data jam sibuk ke localStorage
 */
export function savePeakHoursData(data: PeakHourBucket[]): void {
  try {
    if (!Array.isArray(data)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('bsmr_peak_hours_updated'));
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
    data[currentHour].chat += 1;
    savePeakHoursData(data);
  }
}
