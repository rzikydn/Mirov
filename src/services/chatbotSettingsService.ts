// Chatbot Superuser Settings & System Prompt Service

export interface ChatbotSettings {
  welcomeMsg: string;
  waNumber: string;
  adminEmail: string;
  systemPrompt: string;
}

const STORAGE_KEY = 'mirov_chatbot_settings';
const SETTINGS_API_URL = 'http://localhost:5173/api/chatbot-settings';

export const DEFAULT_SETTINGS: ChatbotSettings = {
  welcomeMsg: "Halo! 👋 Selamat datang di LSP BSMR (Badan Sertifikasi Manajemen Risiko). Saya AI Assistant yang siap membantu Anda terkait Skema Sertifikasi, Tips Lulus Kompeten, Jadwal Ujian, atau Cek Masa Berlaku Sertifikat.",
  waNumber: "6281299008899",
  adminEmail: "cs@bsmr.org",
  systemPrompt: "Anda adalah AI Assistant Resmi BSMR (Badan Sertifikasi Manajemen Risiko). Berikan jawaban yang ramah, profesional, akurat sesuai dengan dokumen Knowledge Base BSMR.",
};

/**
 * Membaca pengaturan chatbot dari localStorage (Sync)
 */
export function getChatbotSettings(): ChatbotSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        welcomeMsg: typeof parsed.welcomeMsg === 'string' && parsed.welcomeMsg.trim() ? parsed.welcomeMsg : DEFAULT_SETTINGS.welcomeMsg,
        waNumber: typeof parsed.waNumber === 'string' && parsed.waNumber.trim() ? parsed.waNumber : DEFAULT_SETTINGS.waNumber,
        adminEmail: typeof parsed.adminEmail === 'string' && parsed.adminEmail.trim() ? parsed.adminEmail : DEFAULT_SETTINGS.adminEmail,
        systemPrompt: typeof parsed.systemPrompt === 'string' && parsed.systemPrompt.trim() ? parsed.systemPrompt : DEFAULT_SETTINGS.systemPrompt,
      };
    }
  } catch (e) {
    console.error('Failed to load chatbot settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Fetch pengaturan chatbot dari server API (Async) untuk dukungan multi-origin / pengguna baru
 */
export async function fetchChatbotSettingsAsync(): Promise<ChatbotSettings> {
  try {
    const res = await fetch(SETTINGS_API_URL);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && data.welcomeMsg) {
        const merged: ChatbotSettings = {
          welcomeMsg: data.welcomeMsg || DEFAULT_SETTINGS.welcomeMsg,
          waNumber: data.waNumber || DEFAULT_SETTINGS.waNumber,
          adminEmail: data.adminEmail || DEFAULT_SETTINGS.adminEmail,
          systemPrompt: data.systemPrompt || DEFAULT_SETTINGS.systemPrompt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bsmr_settings_updated'));
        }
        return merged;
      }
    }
  } catch (e) {
    // Fallback ke localStorage jika server offline
  }
  return getChatbotSettings();
}

/**
 * Menyimpan pengaturan superuser baru dan memicu sinkronisasi multi-window, cross-iframe & HTTP API
 */
export function saveChatbotSettings(newSettings: ChatbotSettings): void {
  try {
    // 1. Simpan di localStorage lokal
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

    // 2. HTTP Sync POST ke Vite API Server agar pengunjung baru & iframe lintas domain mendapatkan setting ini
    fetch(SETTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      // 3. Pemicu DOM Event lokal
      window.dispatchEvent(new Event('bsmr_settings_updated'));

      // 4. Send postMessage ke jendela dan iframe anak
      window.postMessage({ type: 'BSMR_SETTINGS_UPDATED', settings: newSettings }, '*');

      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage({ type: 'BSMR_SETTINGS_UPDATED', settings: newSettings }, '*');
        } catch (e) {}
      });

      // 5. BroadcastChannel untuk tab/jendela lain pada origin yang sama
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_settings_sync_channel');
          channel.postMessage({ type: 'BSMR_SETTINGS_UPDATED', settings: newSettings });
          channel.close();
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Failed to save chatbot settings:', e);
  }
}
