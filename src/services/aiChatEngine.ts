import { ChatbotSettings, getChatbotSettings } from './chatbotSettingsService';
import { getFaqList, FaqItem } from './faqSettingsService';
import { queryRagKnowledgeBase } from './ragKnowledgeBase';

export interface AiEngineOptions {
  userQuery: string;
  settings?: ChatbotSettings;
  customText?: string;
  quickPrompts?: Array<{ id: string; label: string; icon: string; answer: string }>;
}

export interface AiEngineResult {
  text: string;
  isContactInfo?: boolean;
  waNumber?: string;
  adminEmail?: string;
  source?: 'api' | 'rag' | 'prompt' | 'fallback';
}

/**
 * Format phone number into clean WhatsApp linkable string and international format
 */
export function formatWaNumber(rawWa: string): { clean: string; display: string } {
  let digits = (rawWa || '').replace(/\D/g, '');
  if (!digits) {
    return { clean: '6281299008899', display: '+62 812-9900-8899' };
  }
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  }
  const display = '+' + digits;
  return { clean: digits, display };
}

/**
 * Fetch AI Engine config from HTTP API endpoint or localStorage
 */
export async function fetchAiConfigAsync(): Promise<any> {
  // Always attempt to fetch the latest server-synced AI config first
  const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
  const AI_CONFIG_URL = import.meta.env.DEV ? '/api/ai-config' : (API_BASE ? `${API_BASE}/api/ai-config` : '');
  if (AI_CONFIG_URL) {
    try {
      const res = await fetch(AI_CONFIG_URL);
      if (res.ok) {
        const data = await res.json();
        if (data && data.apiKey) {
          try {
            localStorage.setItem('mirov_ai_config', JSON.stringify(data));
          } catch (e) {}
          return data;
        }
      }
    } catch (e) {}
  }

  try {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch (e) {}

  return null;
}

/**
 * Main AI Chatbot Engine
 * Evaluates external API keys (Gemini / OpenAI), active system prompt, RAG documents, and contact settings.
 */
export async function generateAiChatResponse(options: AiEngineOptions): Promise<AiEngineResult> {
  const settings = getChatbotSettings();
  const { userQuery, customText, quickPrompts = [] } = options;
  const queryLower = userQuery.toLowerCase().trim();

  // 1. Check if query is asking for contact / "Hubungi BSMR" / WA / Email
  const isContactQuery =
    queryLower.includes('hubungi bsmr') ||
    queryLower.includes('kontak') ||
    queryLower.includes('whatsapp') ||
    queryLower.includes('email admin') ||
    queryLower.includes('nomor wa') ||
    queryLower.includes('no wa') ||
    customText === 'Hubungi BSMR';

  if (isContactQuery) {
    const waFormatted = formatWaNumber(settings.waNumber);
    const email = settings.adminEmail || 'cs@bsmr.org';
    return {
      text: `Anda dapat menghubungi Admin CS BSMR secara langsung melalui:\n\n• 📱 WhatsApp CS: ${waFormatted.display}\n• 📧 Email Admin: ${email}\n\nJam Operasional CS: Senin - Jumat, 08.00 - 17.00 WIB. Klik opsi di bawah untuk terhubung langsung:`,
      isContactInfo: true,
      waNumber: waFormatted.clean,
      adminEmail: email,
      source: 'prompt',
    };
  }

  // 2. Check if query is about bot identity / active system prompt
  const isIdentityQuery =
    queryLower.includes('siapa kamu') ||
    queryLower.includes('siapa anda') ||
    queryLower.includes('siapa ai') ||
    queryLower.includes('system prompt') ||
    queryLower.includes('instruksi ai') ||
    queryLower.includes('peranmu');

  if (isIdentityQuery) {
    return {
      text: `[System Prompt AI Aktif]\n${settings.systemPrompt}`,
      source: 'prompt',
    };
  }

  // 3. Priority 1: Instant Quick Prompts / Direct FAQ Match (<10ms)
  const effectivePrompts = (quickPrompts && quickPrompts.length > 0) ? quickPrompts : getFaqList();
  const matchedPrompt = effectivePrompts.find(
    (p) => queryLower.includes(p.label.toLowerCase()) || p.id === customText || (p.label && userQuery.toLowerCase() === p.label.toLowerCase())
  );
  if (matchedPrompt && matchedPrompt.id !== 'hubungi-bsmr') {
    return { text: matchedPrompt.answer, source: 'prompt' };
  }

  // 4. Fetch active AI config (for Gemini/OpenAI API key)
  const aiConfig = await fetchAiConfigAsync();
  const apiKey = aiConfig?.apiKey ? (aiConfig.apiKey || '').replace(/["'\s]/g, '').trim() : undefined;

  // 5. Priority 2: Instant RAG Vector Knowledge Base Search
  const ragMatch = await queryRagKnowledgeBase(userQuery, apiKey);

  // If RAG search returns direct FAQ match, return instantly
  if (ragMatch && ragMatch.isFaq && ragMatch.conciseFallback) {
    return { text: ragMatch.conciseFallback, source: 'rag' };
  }

  // 6. Priority 3: External LLM API (Gemini / OpenAI) with 3.2-second Fast Timeout
  try {
    if (aiConfig && aiConfig.apiKey && aiConfig.apiKey.trim() !== '') {
      const ragContext = ragMatch?.contextForLlm || '';
      const contextPrompt = ragContext
        ? `\n\n[KONTEKS RAG DOKUMEN]:\n${ragContext}`
        : '';
      const strictSystemInstruction = ragContext
        ? `${settings.systemPrompt}\n\nINSTRUKSI PENTING: Jawab pertanyaan pengguna secara SINGKAT, PADAT, dan LANGSUNG PADA INTI (straight to the point, 1-2 kalimat saja). HANYA jawab poin spesifik yang ditanyakan. DILARANG menyertakan rincian, tabel, atau informasi tambahan lain yang tidak ditanyakan.`
        : settings.systemPrompt;
      const key = (aiConfig.apiKey || '').replace(/["'\s]/g, '').trim();

      if (aiConfig.provider === 'gemini') {
        // Valid Gemini models only: gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro
        const modelsToTry = Array.from(new Set([
          aiConfig.model && !aiConfig.model.includes('3.6') ? aiConfig.model : 'gemini-1.5-flash',
          'gemini-1.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-pro',
        ]));

        for (const targetModel of modelsToTry) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3200); // 3.2s fast timeout

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  systemInstruction: {
                    parts: [{ text: strictSystemInstruction }],
                  },
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: `${userQuery}${contextPrompt}` }],
                    },
                  ],
                  generationConfig: {
                    temperature: aiConfig.temperature ?? 0.4, // Lower temp for concise factual answers
                    maxOutputTokens: aiConfig.maxTokens ?? 300,
                  },
                }),
              }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                return { text: text.trim(), source: 'api' };
              }
            }
          } catch (e: any) {
            // Silently skip to next model or fallback
          }
        }
      } else if (aiConfig.provider === 'openai') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3200);

          const response = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: aiConfig.model || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: `${strictSystemInstruction}${contextPrompt}` },
                  { role: 'user', content: userQuery },
                ],
                temperature: aiConfig.temperature ?? 0.4,
              }),
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
              return { text: text.trim(), source: 'api' };
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('API LLM Call failed, falling back to RAG & System Prompt engine:', e);
  }

  // 7. RAG Fallback if API was skipped, timed out, or not set
  if (ragMatch && ragMatch.conciseFallback) {
    return { text: ragMatch.conciseFallback, source: 'rag' };
  }

  // 7. Keyword-Based Fallback Rules
  if (queryLower.includes('biaya')) {
    return {
      text: 'Biaya Ujian Sertifikasi BSMR Level 1 adalah Rp 2.500.000,- dan Level 2 adalah Rp 4.500.000,- (Belum termasuk PPN 11%).',
      source: 'prompt',
    };
  }
  if (queryLower.includes('jadwal')) {
    return {
      text: 'Jadwal Asesmen BSMR terdekat dilaksanakan pada 12-14 September 2026 secara Hybrid (Online via Computer Based Test & Offline di Kampus BSMR Jakarta).',
      source: 'prompt',
    };
  }
  if (queryLower.includes('perpanjang') || queryLower.includes('skp')) {
    return {
      text: 'Perpanjangan Sertifikat BSMR dilakukan setiap 3 tahun sekali dengan pemenuhan 50 Poin SKP melalui kegiatan perbankan/pelatihan resmi BSMR.',
      source: 'prompt',
    };
  }

  // 8. Intelligent Local Fallback incorporating active System Prompt context
  const personaSnippet = settings.systemPrompt.slice(0, 120);
  return {
    text: `Terima kasih atas pertanyaan Anda. Sesuai panduan System Prompt BSMR (${personaSnippet}...), kami siap memberikan informasi seputar Skema Sertifikasi, Ujian Kompetensi, dan Layanan LSP BSMR. Silakan pilih menu di bawah atau hubungi admin jika memerlukan informasi lebih lanjut.`,
    source: 'fallback',
  };
}
