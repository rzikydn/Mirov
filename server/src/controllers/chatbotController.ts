import { Request, Response } from 'express';
import { eq, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import {
  chatbotFaqs,
  chatbotSettings,
  chatbotSessions,
  chatbotMessages,
  chatbotAnalytics,
} from '../db/schema';

// Default FAQs fallback
const DEFAULT_BSMR_FAQS = [
  {
    id: "cek-sertifikat",
    label: "Cek Masa Berlaku Sertifikat",
    icon: "",
    answer: "Untuk mengecek masa berlaku Sertifikat BSMR Anda, silakan ketikkan Nomor Sertifikat atau Tanggal/Tahun diterbitkannya sertifikat Anda (Contoh: 12/05/2023).",
    category: "Sertifikasi",
    sortOrder: 1,
  },
  {
    id: "apa-bsmr",
    label: "Apa itu BSMR?",
    icon: "",
    answer: "LSP BSMR (Badan Sertifikasi Manajemen Risiko) adalah lembaga sertifikasi profesi resmi di Indonesia yang menguji dan menerbitkan sertifikasi kompetensi manajemen risiko perbankan sesuai standar OJK dan BNSP.",
    category: "Umum",
    sortOrder: 2,
  },
  {
    id: "level-sertifikasi",
    label: "Level Sertifikasi",
    icon: "",
    answer: "BSMR menyelenggarakan sertifikasi Manajemen Risiko dari Level 1 (Tingkat Dasar/Staff) hingga Level 5 (Tingkat Eksekutif/Direksi).",
    category: "Program",
    sortOrder: 3,
  },
  {
    id: "cara-daftar",
    label: "Cara Pendaftaran",
    icon: "",
    answer: "Pendaftaran ujian dapat dilakukan secara online melalui portal bsmr.org pada menu 'Pendaftaran Ujian' atau melalui PIC Bank pengirim.",
    category: "Pendaftaran",
    sortOrder: 4,
  },
  {
    id: "jadwal-lokasi",
    label: "Jadwal & Lokasi",
    icon: "",
    answer: "Jadwal Asesmen BSMR terdekat dilaksanakan pada 12-14 September 2026 secara Hybrid (Online via Computer Based Test & Offline di Kampus BSMR Jakarta).",
    category: "Jadwal",
    sortOrder: 5,
  },
  {
    id: "hubungi-bsmr",
    label: "Hubungi BSMR",
    icon: "",
    answer: "Anda dapat menghubungi Admin CS BSMR via WhatsApp atau Email resmi.",
    category: "Kontak",
    sortOrder: 6,
  },
];

const DEFAULT_SETTINGS = {
  id: 'default',
  botName: 'AI Assistant BSMR',
  welcomeMsg: 'Halo! Selamat datang di Layanan AI BSMR (Badan Sertifikasi Manajemen Risiko). Ada yang bisa saya bantu terkait sertifikasi kompetensi kerja Anda?',
  systemPrompt: `Anda adalah AI Assistant Resmi untuk BSMR (Badan Sertifikasi Manajemen Risiko). Tugas utama Anda adalah memberikan informasi yang akurat, profesional, dan ramah seputar sertifikasi manajemen risiko perbankan di Indonesia. Gunakan bahasa Indonesia yang baku dan santun.`,
  waNumber: '6281299008899',
  adminEmail: 'cs@bsmr.org',
};

// ==========================================
// FAQ CONTROLLERS
// ==========================================

export const getFaqs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await db.select().from(chatbotFaqs).orderBy(asc(chatbotFaqs.sortOrder), asc(chatbotFaqs.createdAt));
    
    // Seed default if empty
    if (list.length === 0) {
      for (const item of DEFAULT_BSMR_FAQS) {
        await db.insert(chatbotFaqs).values(item).onDuplicateKeyUpdate({ set: { label: item.label } });
      }
      res.status(200).json({ success: true, data: DEFAULT_BSMR_FAQS });
      return;
    }

    res.status(200).json({ success: true, data: list });
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    res.status(200).json({ success: true, data: DEFAULT_BSMR_FAQS, fallback: true });
  }
};

export const upsertFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, label, icon = '', answer, category = 'Umum', sortOrder = 0 } = req.body;
    if (!label || !answer) {
      res.status(400).json({ success: false, message: 'Label dan answer wajib diisi' });
      return;
    }

    const faqId = id || `faq-${Date.now()}`;
    await db.insert(chatbotFaqs).values({
      id: faqId,
      label,
      icon,
      answer,
      category,
      sortOrder,
    }).onDuplicateKeyUpdate({
      set: {
        label,
        icon,
        answer,
        category,
        sortOrder,
        updatedAt: new Date(),
      },
    });

    const updated = await db.select().from(chatbotFaqs).orderBy(asc(chatbotFaqs.sortOrder));
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Upsert FAQ error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(chatbotFaqs).where(eq(chatbotFaqs.id, id));
    const updated = await db.select().from(chatbotFaqs).orderBy(asc(chatbotFaqs.sortOrder));
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetFaqs = async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(chatbotFaqs);
    for (const item of DEFAULT_BSMR_FAQS) {
      await db.insert(chatbotFaqs).values(item);
    }
    res.status(200).json({ success: true, data: DEFAULT_BSMR_FAQS });
  } catch (error: any) {
    console.error('Reset FAQs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SETTINGS CONTROLLERS
// ==========================================

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [settings] = await db.select().from(chatbotSettings).where(eq(chatbotSettings.id, 'default'));
    if (!settings) {
      await db.insert(chatbotSettings).values(DEFAULT_SETTINGS).onDuplicateKeyUpdate({ set: { botName: DEFAULT_SETTINGS.botName } });
      res.status(200).json({ success: true, data: DEFAULT_SETTINGS });
      return;
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(200).json({ success: true, data: DEFAULT_SETTINGS, fallback: true });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botName, welcomeMsg, systemPrompt, waNumber, adminEmail } = req.body;
    await db.insert(chatbotSettings).values({
      id: 'default',
      botName: botName || DEFAULT_SETTINGS.botName,
      welcomeMsg: welcomeMsg || DEFAULT_SETTINGS.welcomeMsg,
      systemPrompt: systemPrompt || DEFAULT_SETTINGS.systemPrompt,
      waNumber: waNumber || DEFAULT_SETTINGS.waNumber,
      adminEmail: adminEmail || DEFAULT_SETTINGS.adminEmail,
    }).onDuplicateKeyUpdate({
      set: {
        botName,
        welcomeMsg,
        systemPrompt,
        waNumber,
        adminEmail,
        updatedAt: new Date(),
      },
    });

    const [updated] = await db.select().from(chatbotSettings).where(eq(chatbotSettings.id, 'default'));
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// VISITOR SESSIONS & MESSAGES CONTROLLERS
// ==========================================

export const getSessions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await db.select().from(chatbotSessions).orderBy(desc(chatbotSessions.updatedAt));
    const fullSessions = await Promise.all(
      sessions.map(async (sess) => {
        const messages = await db
          .select()
          .from(chatbotMessages)
          .where(eq(chatbotMessages.sessionId, sess.id))
          .orderBy(asc(chatbotMessages.createdAt));
        return {
          id: sess.id,
          visitorId: sess.visitorId,
          title: sess.title,
          isEscalated: sess.isEscalated,
          isUnread: sess.isUnread,
          lastSender: sess.lastSender,
          messages,
          createdAt: sess.createdAt,
          updatedAt: sess.updatedAt,
        };
      })
    );
    res.status(200).json({ success: true, data: fullSessions });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, visitorId, title, isEscalated, isUnread, messages = [] } = req.body;
    if (!id || !visitorId) {
      res.status(400).json({ success: false, message: 'id dan visitorId wajib diisi' });
      return;
    }

    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const preview = lastMsg ? (lastMsg.text || '').slice(0, 100) : 'Sesi chat baru';
    const lastSender = lastMsg ? lastMsg.sender : 'user';

    await db.insert(chatbotSessions).values({
      id,
      visitorId,
      title: title || preview,
      isEscalated: Boolean(isEscalated),
      isUnread: isUnread !== undefined ? Boolean(isUnread) : true,
      lastSender,
      preview,
    }).onDuplicateKeyUpdate({
      set: {
        title: title || preview,
        isEscalated: Boolean(isEscalated),
        isUnread: isUnread !== undefined ? Boolean(isUnread) : false,
        lastSender,
        preview,
        updatedAt: new Date(),
      },
    });

    // Save/upsert individual messages
    for (const msg of messages) {
      if (!msg.id || !msg.text) continue;
      await db.insert(chatbotMessages).values({
        id: msg.id,
        sessionId: id,
        sender: msg.sender || 'user',
        text: msg.text,
        time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feedback: msg.feedback || null,
        isContactInfo: Boolean(msg.isContactInfo),
        isEscalation: Boolean(msg.isEscalation),
        waNumber: msg.waNumber || null,
        adminEmail: msg.adminEmail || null,
      }).onDuplicateKeyUpdate({
        set: {
          feedback: msg.feedback || null,
          text: msg.text,
        },
      });
    }

    res.status(200).json({ success: true, message: 'Sesi dan pesan berhasil disimpan' });
  } catch (error: any) {
    console.error('Save session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markSessionAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.update(chatbotSessions).set({ isUnread: false }).where(eq(chatbotSessions.id, id));
    res.status(200).json({ success: true, message: 'Sesi ditandai sudah dibaca' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(chatbotMessages).where(eq(chatbotMessages.sessionId, id));
    await db.delete(chatbotSessions).where(eq(chatbotSessions.id, id));
    res.status(200).json({ success: true, message: 'Sesi berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ANALYTICS CONTROLLERS
// ==========================================

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { metricType } = req.query;
    if (metricType) {
      const records = await db.select().from(chatbotAnalytics).where(eq(chatbotAnalytics.metricType, String(metricType)));
      res.status(200).json({ success: true, data: records });
      return;
    }
    const all = await db.select().from(chatbotAnalytics);
    res.status(200).json({ success: true, data: all });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, metricType, dataJson } = req.body;
    if (!id || !metricType || !dataJson) {
      res.status(400).json({ success: false, message: 'id, metricType, dan dataJson wajib diisi' });
      return;
    }
    await db.insert(chatbotAnalytics).values({
      id,
      metricType,
      dataJson,
    }).onDuplicateKeyUpdate({
      set: {
        dataJson,
        updatedAt: new Date(),
      },
    });
    res.status(200).json({ success: true, message: 'Analytics berhasil disimpan' });
  } catch (error: any) {
    console.error('Update analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
