import { Request, Response } from 'express';
import { db } from '../db';
import {
  chatbotSettings,
  chatbotFaqs,
  ragDocuments,
  ragChunks,
  visitorChatSessions,
  visitorChatMessages,
  chatbotAnalyticsLogs,
} from '../db/schema';
import { eq, desc } from 'drizzle-orm';

// 1. Get Chatbot Settings
export async function getSettings(_req: Request, res: Response) {
  try {
    const settingsList = await db.select().from(chatbotSettings).limit(1);
    if (settingsList.length > 0) {
      return res.json({ success: true, data: settingsList[0] });
    }
    // Return default settings if empty
    return res.json({
      success: true,
      data: {
        botName: 'BSMR AI Assistant',
        welcomeMessage: 'Halo! Selamat datang di Website Resmi BSMR. Ada yang bisa kami bantu terkait Sertifikasi Manajemen Risiko Perbankan?',
        waNumber: '6281299008899',
        systemPrompt: 'Anda adalah AI Assistant Resmi BSMR (Badan Sertifikasi Manajemen Risiko). Berikan jawaban yang ramah, profesional, akurat sesuai dengan dokumen Knowledge Base BSMR.',
        temperature: '0.7',
        modelName: 'gemini-1.5-flash',
        autoEscalation: true,
      },
    });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan chatbot' });
  }
}

// 2. Update Chatbot Settings
export async function updateSettings(req: Request, res: Response) {
  try {
    const { botName, welcomeMessage, waNumber, systemPrompt, temperature, modelName, autoEscalation } = req.body;
    const settingsList = await db.select().from(chatbotSettings).limit(1);

    if (settingsList.length > 0) {
      await db.update(chatbotSettings)
        .set({
          botName,
          welcomeMessage,
          waNumber,
          systemPrompt,
          temperature,
          modelName,
          autoEscalation,
          updatedAt: new Date(),
        })
        .where(eq(chatbotSettings.id, settingsList[0].id));
    } else {
      await db.insert(chatbotSettings).values({
        botName,
        welcomeMessage,
        waNumber,
        systemPrompt,
        temperature,
        modelName,
        autoEscalation,
      });
    }

    return res.json({ success: true, message: 'Pengaturan AI Chatbot berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan chatbot' });
  }
}

// 3. Get FAQs
export async function getFaqs(_req: Request, res: Response) {
  try {
    const faqs = await db.select().from(chatbotFaqs).orderBy(desc(chatbotFaqs.hits));
    return res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar FAQ' });
  }
}

// 4. Add FAQ
export async function addFaq(req: Request, res: Response) {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Pertanyaan dan jawaban wajib diisi' });
    }

    const [inserted] = await db.insert(chatbotFaqs).values({
      question,
      answer,
      category: category || 'Umum',
      hits: 0,
      status: 'ACTIVE',
    }).$returningId();

    return res.json({ success: true, message: 'FAQ berhasil ditambahkan', data: { id: inserted.id } });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambah FAQ' });
  }
}

// 5. Delete FAQ
export async function deleteFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await db.delete(chatbotFaqs).where(eq(chatbotFaqs.id, Number(id)));
    return res.json({ success: true, message: 'FAQ berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus FAQ' });
  }
}

// 6. Get RAG Documents
export async function getRagDocuments(_req: Request, res: Response) {
  try {
    const docs = await db.select().from(ragDocuments).orderBy(desc(ragDocuments.createdAt));
    return res.json({ success: true, data: docs });
  } catch (error) {
    console.error('Error fetching RAG documents:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil materi RAG' });
  }
}

// 7. Add RAG Document & Chunks
export async function addRagDocument(req: Request, res: Response) {
  try {
    const { title, fileType, category, fileSize, chunks } = req.body;
    if (!title || !fileType) {
      return res.status(400).json({ success: false, message: 'Judul dan tipe file wajib diisi' });
    }

    const [doc] = await db.insert(ragDocuments).values({
      title,
      fileType,
      category: category || 'Materi',
      fileSize: fileSize || '1.0 MB',
      chunkCount: Array.isArray(chunks) ? chunks.length : 1,
      status: 'INDEXED',
    }).$returningId();

    // Insert chunks if provided
    if (Array.isArray(chunks) && chunks.length > 0) {
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        await db.insert(ragChunks).values({
          documentId: doc.id,
          chunkIndex: i,
          content: typeof c === 'string' ? c : c.content || '',
          embedding: c.embedding || null,
        });
      }
    }

    return res.json({ success: true, message: 'Dokumen RAG berhasil disimpan', data: { id: doc.id } });
  } catch (error) {
    console.error('Error adding RAG document:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan dokumen RAG' });
  }
}

// 8. Delete RAG Document
export async function deleteRagDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await db.delete(ragDocuments).where(eq(ragDocuments.id, Number(id)));
    return res.json({ success: true, message: 'Dokumen RAG berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting RAG document:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus dokumen RAG' });
  }
}

// 9. Get Visitor Chat Sessions & Logs
export async function getVisitorSessions(_req: Request, res: Response) {
  try {
    const sessions = await db.select().from(visitorChatSessions).orderBy(desc(visitorChatSessions.lastActive));
    const result = [];

    for (const session of sessions) {
      const messages = await db
        .select()
        .from(visitorChatMessages)
        .where(eq(visitorChatMessages.sessionId, session.sessionId))
        .orderBy(visitorChatMessages.timestamp);

      result.push({
        id: session.sessionId,
        visitorName: session.visitorName,
        visitorIp: session.visitorIp,
        startedAt: session.startedAt,
        lastActive: session.lastActive,
        status: session.status,
        messages: messages.map((m) => ({
          id: `msg-${m.id}`,
          sender: m.sender,
          text: m.message,
          timestamp: m.timestamp,
        })),
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching visitor chat sessions:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat sesi chat' });
  }
}

// 10. Delete Visitor Chat Sessions
export async function deleteVisitorSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    if (sessionId === 'ALL') {
      await db.delete(visitorChatMessages);
      await db.delete(visitorChatSessions);
      return res.json({ success: true, message: 'Seluruh log sesi chat berhasil dibersihkan' });
    }

    await db.delete(visitorChatMessages).where(eq(visitorChatMessages.sessionId, sessionId));
    await db.delete(visitorChatSessions).where(eq(visitorChatSessions.sessionId, sessionId));
    return res.json({ success: true, message: 'Sesi chat berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting visitor session:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus sesi chat' });
  }
}

// 11. Admin Reply to Visitor Session
export async function addAdminReply(req: Request, res: Response) {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, message: 'Session ID dan balasan admin wajib diisi' });
    }

    await db.insert(visitorChatMessages).values({
      sessionId,
      sender: 'admin',
      message,
    });

    await db
      .update(visitorChatSessions)
      .set({
        status: 'ESCALATED',
        lastActive: new Date(),
      })
      .where(eq(visitorChatSessions.sessionId, sessionId));

    return res.json({ success: true, message: 'Balasan admin berhasil dikirim' });
  } catch (error) {
    console.error('Error adding admin reply:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengirim balasan admin' });
  }
}

// 12. Process Visitor Chat Message (RAG + FAQ + Chat Memory Window)
export async function processChatMessage(req: Request, res: Response) {
  try {
    const { sessionId, message, visitorName } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Pesan wajib diisi' });
    }

    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Ensure session exists in MySQL
    const existingSession = await db.select().from(visitorChatSessions).where(eq(visitorChatSessions.sessionId, currentSessionId)).limit(1);
    if (existingSession.length === 0) {
      await db.insert(visitorChatSessions).values({
        sessionId: currentSessionId,
        visitorName: visitorName || 'Pengunjung BSMR',
        status: 'SELF_SERVED',
        messageCount: 1,
      });
    } else {
      await db
        .update(visitorChatSessions)
        .set({
          messageCount: (existingSession[0].messageCount || 0) + 1,
          lastActive: new Date(),
        })
        .where(eq(visitorChatSessions.sessionId, currentSessionId));
    }

    // Save User message to Memory
    await db.insert(visitorChatMessages).values({
      sessionId: currentSessionId,
      sender: 'user',
      message,
    });

    // Retrieve Memory Window (Last 5 messages context)
    const memoryMessages = await db
      .select()
      .from(visitorChatMessages)
      .where(eq(visitorChatMessages.sessionId, currentSessionId))
      .orderBy(desc(visitorChatMessages.timestamp))
      .limit(6);

    const reversedMemory = memoryMessages.reverse();

    // RAG Search in FAQs & Chunks
    const queryLower = message.toLowerCase();
    const faqs = await db.select().from(chatbotFaqs).where(eq(chatbotFaqs.status, 'ACTIVE'));
    let matchedFaq = faqs.find((f) => queryLower.includes(f.question.toLowerCase()) || f.question.toLowerCase().includes(queryLower));

    let replyText = '';
    if (matchedFaq) {
      replyText = matchedFaq.answer;
      // Increment FAQ hits
      await db.update(chatbotFaqs).set({ hits: (matchedFaq.hits || 0) + 1 }).where(eq(chatbotFaqs.id, matchedFaq.id));
    } else {
      // Search in RAG Chunks using keyword match
      const chunks = await db.select().from(ragChunks).limit(50);
      const matchingChunk = chunks.find((c) => c.content.toLowerCase().includes(queryLower));

      if (matchingChunk) {
        replyText = matchingChunk.content;
      } else {
        replyText = 'Terima kasih telah menghubungi BSMR. Pertanyaan Anda mengenai "' + message + '" telah dicatat. Tim CS kami siap membantu Anda lebih lanjut.';
      }
    }

    // Save Bot Reply to Memory
    await db.insert(visitorChatMessages).values({
      sessionId: currentSessionId,
      sender: 'bot',
      message: replyText,
    });

    return res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        reply: replyText,
        memoryLength: reversedMemory.length,
      },
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses pesan chat AI' });
  }
}

// 13. Get Chatbot Analytics
export async function getAnalytics(_req: Request, res: Response) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const log = await db.select().from(chatbotAnalyticsLogs).where(eq(chatbotAnalyticsLogs.logDate, todayStr)).limit(1);

    if (log.length > 0) {
      return res.json({ success: true, data: log[0] });
    }

    // Graceful Empty State (Murni Data Asli / Clean Slate)
    return res.json({
      success: true,
      data: {
        logDate: todayStr,
        totalInteractions: 0,
        solvedCount: 0,
        escalatedCount: 0,
        outOfHoursCount: 0,
        peakHourCounts: Array(24).fill(0),
        topQuestions: [],
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil statistik chatbot' });
  }
}
