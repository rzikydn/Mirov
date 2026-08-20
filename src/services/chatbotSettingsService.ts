// Chatbot Superuser Settings & System Prompt Service

export interface ChatbotSettings {
  welcomeMsg: string;
  waNumber: string;
  adminEmail: string;
  systemPrompt: string;
}

const STORAGE_KEY = 'mirov_chatbot_settings';

export const DEFAULT_SETTINGS: ChatbotSettings = {
  welcomeMsg: "Halo! 👋 Selamat datang di LSP BSMR (Badan Sertifikasi Manajemen Risiko). Saya AI Assistant yang siap membantu Anda terkait Skema Sertifikasi, Tips Lulus Kompeten, Jadwal Ujian, atau Cek Masa Berlaku Sertifikat.",
  waNumber: "6281299008899",
  adminEmail: "cs@bsmr.org",
  systemPrompt: "Anda adalah AI Assistant Resmi BSMR (Badan Sertifikasi Manajemen Risiko). Berikan jawaban yang ramah, profesional, akurat sesuai dengan dokumen Knowledge Base BSMR.",
};

/**
 * Membaca pengaturan chatbot dari localStorage
 */
export function getChatbotSettings(): ChatbotSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        welcomeMsg: parsed.welcomeMsg || DEFAULT_SETTINGS.welcomeMsg,
        waNumber: parsed.waNumber || DEFAULT_SETTINGS.waNumber,
        adminEmail: parsed.adminEmail || DEFAULT_SETTINGS.adminEmail,
        systemPrompt: parsed.systemPrompt || DEFAULT_SETTINGS.systemPrompt,
      };
    }
  } catch (e) {
    console.error('Failed to load chatbot settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Menyimpan pengaturan superuser baru dan memicu event 'bsmr_settings_updated'
 */
export function saveChatbotSettings(newSettings: ChatbotSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    window.dispatchEvent(new Event('bsmr_settings_updated'));
  } catch (e) {
    console.error('Failed to save chatbot settings:', e);
  }
}
