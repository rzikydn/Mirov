import { ChatbotSettings, getChatbotSettings } from './chatbotSettingsService';
import { getFaqList, FaqItem } from './faqSettingsService';
import { retrieveRagContext, queryRagKnowledgeBase } from './ragKnowledgeBase';

import { recordAiUsage } from './aiUsageService';

export interface AiEngineOptions {
  userQuery: string;
  settings?: ChatbotSettings;
  customText?: string;
  quickPrompts?: Array<{ id: string; label: string; icon?: string; answer: string; category?: string }>;
  history?: Array<{ sender: "user" | "bot" | "admin"; text: string }>;
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
  // 1. Cek localStorage terlebih dahulu (langsung dari sesi browser aktif, tanpa latency)
  try {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.apiKey.trim() !== '') return parsed;
    }
  } catch (e) {}

  // 2. Fallback sinkronisasi dari server HTTP jika ada
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

  // 3. Fallback konfigurasi parsial di localStorage
  try {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) return parsed;
    }
  } catch (e) {}

  return null;
}

/**
 * Apply word filtering (restricted words) to the generated output
 */
function applyFilterWords(text: string, filterWords?: string[]): string {
  if (!text || !Array.isArray(filterWords) || filterWords.length === 0) {
    return text;
  }
  let sanitized = text;
  for (const word of filterWords) {
    const trimmed = word.trim();
    if (trimmed) {
      const regex = new RegExp(`\\b${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '***');
    }
  }
  return sanitized;
}

/**
 * Clean and beautifully format AI chatbot response text:
 * - Strips raw Markdown asterisks (**, *, ***)
 * - Converts bullet asterisks/hyphens (*, -, +) into neat bullet points (•)
 * - Removes markdown horizontal dividers (---, ___)
 * - Normalizes empty lines and spacing
 * - Applies filter words
 */
export function cleanAndFormatResponse(rawText: string, filterWords?: string[]): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // 1. Remove markdown horizontal dividers like ---, ___, ***
  text = text.replace(/^(?:-{3,}|_{3,}|\*{3,})\s*$/gm, '');

  // 2. Remove markdown header prefixes (###, ##, #)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 3. Normalize bullet points: convert lines starting with * or - or + to clean •
  text = text.replace(/^[\t ]*(?:\*|\-|\+)\s*(?:\*\*)?/gm, '• ');

  // 4. Remove bold & italic markdown asterisks and underscores (**text**, *text*, __text__, _text_)
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');

  // Clean any stray asterisks left behind
  text = text.replace(/\*+/g, '');

  // 5. Normalize spacing on bullet items: ensure "• Text" (with clean space)
  text = text.replace(/^•\s*/gm, '• ');

  // 6. Ensure long walls of text are nicely split into paragraphs of 2-3 sentences
  const paragraphs = text.split(/\n{2,}/);
  const formattedParagraphs = paragraphs.map((p) => {
    // If it has bullet points or numbers, preserve structure
    if (p.includes('•') || /^\d+\./m.test(p)) {
      return p;
    }
    // If paragraph is long (> 180 chars and has multiple sentences), split into comfortable paragraphs
    if (p.length > 180) {
      const sentences = p.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      if (sentences.length >= 3) {
        const chunks: string[] = [];
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push(sentences.slice(i, i + 2).join(' '));
        }
        return chunks.join('\n\n');
      }
    }
    return p;
  });
  text = formattedParagraphs.join('\n\n');

  // Fix excessive newlines (max 2 newlines = 1 blank line between paragraphs)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 7. Apply word filter
  text = applyFilterWords(text, filterWords);

  return text.trim();
}

/**
 * Main AI Chatbot Layered Architecture (FAQ + RAG + LLM Brain):
 * 
 * 1. User bertanya ke chatbot widget.
 * 2. Cek FAQ (Prioritas Konteks Tertinggi) — cari entri FAQ yang cocok & relevan.
 * 3. RAG Vector DB Search — ambil chunk dokumen resmi (PDF/DOCX/PPTX) via similarity search.
 * 4. Context Fusion — gabungkan FAQ + RAG context + System Prompt + Kontak Resmi + Filter Words.
 * 5. LLM Engine (Gemini / OpenAI) — mengolah seluruh konteks menjadi jawaban natural, akurat & grounded.
 * 6. Fallback cerdas jika LLM API offline / belum disetel.
 */
export async function generateAiChatResponse(options: AiEngineOptions): Promise<AiEngineResult> {
  const settings = getChatbotSettings();
  const { userQuery, customText, quickPrompts = [], history = [] } = options;
  const queryLower = userQuery.toLowerCase().trim();

  // 1. Direct Contact Query Handler (Fast Routing for CS / WhatsApp / Email)
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

  // 2. Direct Identity Query Handler
  const isIdentityQuery =
    queryLower.includes('siapa kamu') ||
    queryLower.includes('siapa anda') ||
    queryLower.includes('siapa ai') ||
    queryLower.includes('system prompt') ||
    queryLower.includes('instruksi ai') ||
    queryLower.includes('peranmu');

  if (isIdentityQuery) {
    return {
      text: `[BSMR AI Assistant]\n${settings.systemPrompt}`,
      source: 'prompt',
    };
  }

  // =========================================================================
  // LAPISAN 1: FAQ KNOWLEDGE GATHERING & EXACT MATCH CHECK
  // =========================================================================
  const allFaqs = getFaqList();
  const effectivePrompts = (quickPrompts && quickPrompts.length > 0) ? quickPrompts : allFaqs;

  // Cek apakah ada exact FAQ match (misal tombol FAQ diklik langsung)
  const exactFaqMatch = effectivePrompts.find(
    (p) => p.id === customText || queryLower === p.label.toLowerCase() || (queryLower.length > 5 && p.label.toLowerCase().includes(queryLower))
  );

  // Kumpulkan semua FAQ yang relevan dengan pertanyaan user untuk dijadikan konteks berprioritas tinggi
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2);
  const relevantFaqs = allFaqs.filter((faq) => {
    const combinedFaqText = `${faq.label} ${faq.answer} ${faq.category || ''}`.toLowerCase();
    return queryTokens.some((token) => combinedFaqText.includes(token));
  });

  // Susun teks konteks FAQ
  let faqContextText = '';
  if (exactFaqMatch && exactFaqMatch.id !== 'hubungi-bsmr') {
    faqContextText += `• Pertanyaan: ${exactFaqMatch.label}\n  Jawaban Resmi: ${exactFaqMatch.answer}\n`;
  }
  relevantFaqs.slice(0, 3).forEach((faq) => {
    if (!exactFaqMatch || faq.id !== exactFaqMatch.id) {
      faqContextText += `• Pertanyaan: ${faq.label}\n  Jawaban Resmi: ${faq.answer}\n`;
    }
  });

  // =========================================================================
  // LAPISAN 2: RAG VECTOR DATABASE RETRIEVAL
  // =========================================================================
  const aiConfig = await fetchAiConfigAsync();
  const apiKey = aiConfig?.apiKey ? (aiConfig.apiKey || '').replace(/["'\s]/g, '').trim() : undefined;

  let ragContextText = '';
  let ragFallbackSnippet = '';

  try {
    const ragMatch = await queryRagKnowledgeBase(userQuery, apiKey);
    if (ragMatch) {
      ragContextText = ragMatch.contextForLlm || '';
      ragFallbackSnippet = ragMatch.conciseFallback || '';
    }
  } catch (e) {
    console.warn('[RAG] Retrieval warning:', e);
  }

  // =========================================================================
  // LAPISAN 3: CONTEXT FUSION & PROMPT PREPARATION
  // =========================================================================
  const hasFaqContext = Boolean(faqContextText.trim());
  const hasRagContext = Boolean(ragContextText.trim());
  const combinedContext = [
    hasFaqContext ? `[SUMBER PENGETAHUAN FAQ RESMI BSMR]:\n${faqContextText}` : '',
    hasRagContext ? `[SUMBER DOKUMEN RESMI (RAG KNOWLEDGE BASE)]:\n${ragContextText}` : '',
  ].filter(Boolean).join('\n\n');

  const filterWordsList = Array.isArray(aiConfig?.filterWords) ? aiConfig.filterWords : ['kata-kasar', 'promosi-ilegal'];
  const filterWordsNotice = filterWordsList.length > 0
    ? `\n\n[FILTER KATA TERLARANG]: DILARANG menggunakan atau menyebutkan kata-kata berikut: ${filterWordsList.join(', ')}.`
    : '';

  const timeZoneNotice = aiConfig?.timeZone ? `\nZona Waktu Operasional: ${aiConfig.timeZone}.` : '';

  const defaultRefusalMessage = 'Mohon maaf, informasi mengenai pertanyaan tersebut belum tercantum dalam basis data resmi kami.\n\nSilakan pilih topik pertanyaan populer di bawah atau hubungi Admin CS BSMR melalui WhatsApp/Email resmi untuk bantuan lebih lanjut.';

  const systemInstruction = `Anda adalah BSMR AI Assistant resmi (LSP Badan Sertifikasi Manajemen Risiko).
Tugas Anda adalah menjawab pertanyaan pengguna secara natural, ramah, profesional, jelas, dan terstruktur rapi.

[PANDUAN FORMAT & TATA LETAK PARAGRAF (SANGAT PENTING)]:
1. DILARANG menumpuk seluruh jawaban ke dalam 1 paragraf panjang atau 1 baris menyambung.
2. JIKA JAWABAN PANJANG, WAJIB DIBAGI MENJADI BEBERAPA PARAGRAF PENDEK (maksimal 2-3 kalimat per paragraf) dengan jarak 1 baris kosong (double newline) antar paragraf agar rapi dan nyaman dibaca.
3. Untuk rincian, daftar kualifikasi, atau persyaratan, gunakan format point-list dengan simbol bullet standar (• ) atau angka (1., 2.).
4. DILARANG menggunakan format markdown asterisks (*, **), garis pemisah (---), atau hashtag (#).
5. Tuliskan jawaban dalam format teks bersih dengan tanda baca baku Bahasa Indonesia yang benar dan huruf kapital yang tepat.
6. Gunakan SUMBER PENGETAHUAN RESMI BSMR (FAQ dan Dokumen RAG) sebagai rujukan fakta utama. DILARANG berhalusinasi.
7. JIKA PERTANYAAN DI LUAR KONTEKS layanan perbankan/BSMR, atau jika informasi belum tercantum dalam basis data resmi, jawab PERSIS HANYA dengan kalimat berikut:
"${defaultRefusalMessage}"
${settings.systemPrompt ? `\n[PANDUAN KARAKTER/SYSTEM PROMPT]:\n${settings.systemPrompt}` : ''}${filterWordsNotice}${timeZoneNotice}`;

  // =========================================================================
  // LAPISAN 4: LLM ENGINE (GEMINI / GROQ) — SEBAGAI "OTAK" PENGHASIL JAWABAN
  // =========================================================================
  if (aiConfig && apiKey && apiKey !== '') {
    try {
      const userPromptWithContext = combinedContext
        ? `${combinedContext}\n\n[PERTANYAAN PENGGUNA]:\n${userQuery}\n\nInstruksi Jawaban:\n- Jawab langsung inti pertanyaan pengguna secara lengkap dan solutif berdasarkan konteks resmi di atas.\n- WAJIB buat jawaban dalam beberapa paragraf pendek terpisah (pisahkan dengan 1 baris kosong) atau gunakan bullet points (•).\n- DILARANG menumpuk jawaban menjadi satu baris panjang.\n- DILARANG menggunakan tanda bintang (*, **), pagar (#), atau garis pemisah.\n- Jika pertanyaan di luar konteks, jawab dengan kalimat penolakan sopan resmi BSMR.`
        : `${userQuery}\n\nInstruksi Jawaban:\n- Berikan jawaban profesional dalam beberapa paragraf pendek rapi (pisahkan dengan 1 baris kosong).\n- DILARANG menumpuk jawaban menjadi 1 baris panjang.`;

      // 4A. Google Gemini Engine
      if (aiConfig.provider === 'gemini') {
        const configuredModel = aiConfig.model || 'gemini-3.5-flash';

        const candidateModels = Array.from(new Set([
          configuredModel,
          'gemini-3.5-flash',
          'gemini-3.7-flash',
          'gemini-2.5-flash',
        ]));

        console.log('[BSMR Gemini LLM] Memulai panggilan API dengan model kandidat:', candidateModels, 'API Key:', apiKey.slice(0, 8) + '...');

        for (const targetModel of candidateModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 9500);

            // Coba payload terstruktur (systemInstruction + contents)
            let response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-goog-api-key': apiKey,
                },
                signal: controller.signal,
                body: JSON.stringify({
                  systemInstruction: {
                    parts: [{ text: systemInstruction }],
                  },
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: userPromptWithContext }],
                    },
                  ],
                  generationConfig: {
                    temperature: typeof aiConfig.temperature === 'number' ? aiConfig.temperature : 0.4,
                    maxOutputTokens: typeof aiConfig.maxTokens === 'number' ? aiConfig.maxTokens : 800,
                  },
                }),
              }
            );

            // Jika payload terstruktur ditolak (HTTP 400), coba format universal sederhana (proven di Test Connection)
            if (!response.ok && (response.status === 400 || response.status === 404)) {
              console.warn(`[Gemini API] Target ${targetModel} status ${response.status}, mencoba universal fallback payload...`);
              const fullPrompt = `${systemInstruction}\n\n${userPromptWithContext}`;
              response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                  },
                  signal: controller.signal,
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [{ text: fullPrompt }],
                      },
                    ],
                  }),
                }
              );
            }

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim()) {
                const totalTokens = data?.usageMetadata?.totalTokenCount || Math.ceil((userPromptWithContext.length + text.length) / 4);
                recordAiUsage('gemini', totalTokens);
                const cleanedText = cleanAndFormatResponse(text.trim(), filterWordsList);
                console.log(`[BSMR Gemini LLM] Berhasil merespons dari model: ${targetModel} (${totalTokens} tokens)`);
                return { text: cleanedText, source: 'api' };
              }
            } else {
              const errBody = await response.json().catch(() => ({}));
              console.warn(`[Gemini API] Model ${targetModel} returned status ${response.status}:`, errBody);
            }
          } catch (e: any) {
            console.warn(`[Gemini API] Failed call to ${targetModel}:`, e.message);
          }
        }
      }

      // 4B. Groq LPU Engine (Super Cepat, Akurat, Gratis)
      if (aiConfig.provider === 'groq') {
        const groqModel = aiConfig.model || 'llama-3.3-70b-versatile';
        const candidateGroqModels = Array.from(new Set([
          groqModel,
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant',
          'qwen/qwen3.6-27b',
        ]));

        console.log('[BSMR Groq LLM] Memulai panggilan API Groq dengan model:', candidateGroqModels, 'API Key:', apiKey.slice(0, 8) + '...');

        for (const targetModel of candidateGroqModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 9500);

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: targetModel,
                messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: userPromptWithContext },
                ],
                temperature: typeof aiConfig.temperature === 'number' ? aiConfig.temperature : 0.4,
                max_tokens: typeof aiConfig.maxTokens === 'number' ? aiConfig.maxTokens : 800,
              }),
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const text = data?.choices?.[0]?.message?.content;
              if (text && text.trim()) {
                const totalTokens = data?.usage?.total_tokens || Math.ceil((userPromptWithContext.length + text.length) / 4);
                recordAiUsage('groq', totalTokens);
                const cleanedText = cleanAndFormatResponse(text.trim(), filterWordsList);
                console.log(`[BSMR Groq LLM] Berhasil merespons dari model: ${targetModel} (${totalTokens} tokens)`);
                return { text: cleanedText, source: 'api' };
              }
            } else {
              const errBody = await response.json().catch(() => ({}));
              console.warn(`[Groq API] Model ${targetModel} returned status ${response.status}:`, errBody);
            }
          } catch (e: any) {
            console.warn(`[Groq API] Failed call to ${targetModel}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.warn('[LLM Engine] API call error, cascading to context fallback:', e);
    }
  }

  // =========================================================================
  // LAPISAN 5: GROUNDED CONTEXT FALLBACK (Saat LLM offline / tanpa API Key)
  // =========================================================================
  // 5A. Jika ada FAQ yang match persis / relevan tinggi
  if (exactFaqMatch && exactFaqMatch.id !== 'hubungi-bsmr') {
    return { text: cleanAndFormatResponse(exactFaqMatch.answer, filterWordsList), source: 'prompt' };
  }

  // 5B. Aturan Faktual Resmi BSMR Terarah (Menjawab Langsung Pertanyaan Umum dengan Paragraf Rapi)
  if (
    queryLower.includes('mengapa saya harus ikut sertifikasi') ||
    queryLower.includes('kenapa harus ikut sertifikasi') ||
    queryLower.includes('mengapa harus sertifikasi') ||
    queryLower.includes('kenapa perlu sertifikasi') ||
    queryLower.includes('manfaat sertifikasi') ||
    queryLower.includes('keuntungan sertifikasi') ||
    queryLower.includes('tujuan ikut sertifikasi') ||
    (queryLower.includes('mengapa') && queryLower.includes('sertifikasi')) ||
    (queryLower.includes('harus') && queryLower.includes('sertifikasi'))
  ) {
    return {
      text: 'Mengikuti Sertifikasi Manajemen Risiko di LSP BSMR memiliki beberapa manfaat strategis utama bagi bankir dan profesional perbankan:\n\n1. Kepatuhan Regulasi (Compliance):\n• Memenuhi kewajiban regulasi Otoritas Jasa Keuangan (OJK) dan Bank Indonesia yang mewajibkan pejabat serta praktisi perbankan memiliki sertifikasi kompetensi manajemen risiko yang terakreditasi resmi.\n\n2. Pengakuan Standar Kompetensi Nasional:\n• Memperoleh Sertifikat Kompetensi resmi berlisensi BNSP (Badan Nasional Sertifikasi Profesi) yang membuktikan keahlian profesional Anda sesuai standar SKKNI Nomor 218 Tahun 2020.\n\n3. Jenjang Karir & Kredibilitas Profesional:\n• Menjadi syarat kualifikasi formal dalam promosi jabatan struktural perbankan, penugasan fungsi manajemen risiko, dan pemenuhan kriteria fit and proper test regulator.\n\n4. Menjaga Ketahanan Bank:\n• Membekali Anda dengan keahlian praktis dalam mengidentifikasi, mengukur, memantau, dan mengendalikan berbagai risiko perbankan (pasar, kredit, operasional, likuiditas, hukum, reputasi, stratejik, dan kepatuhan).',
      source: 'prompt',
    };
  }
  if (
    queryLower.includes('mengapa ada bsmr') ||
    queryLower.includes('kenapa ada bsmr') ||
    queryLower.includes('tujuan bsmr') ||
    queryLower.includes('fungsi bsmr') ||
    queryLower.includes('latar belakang bsmr')
  ) {
    return {
      text: 'LSP Badan Sertifikasi Manajemen Risiko (BSMR) didirikan sebagai Lembaga Sertifikasi Profesi resmi untuk memastikan standar kompetensi kerja dan integritas para bankir serta praktisi perbankan di Indonesia dalam mengelola risiko perbankan.\n\nBSMR beroperasi dengan acuan Standar Kompetensi Kerja Nasional Indonesia (SKKNI Nomor 218 Tahun 2020), berada di bawah ketentuan regulasi Otoritas Jasa Keuangan (OJK), dan memegang lisensi resmi dari Badan Nasional Sertifikasi Profesi (BNSP No: BNSP-LSP-027-ID) guna menjaga ketahanan sistem perbankan nasional.',
      source: 'prompt',
    };
  }

  if (
    (queryLower.includes('siap') || queryLower.includes('syarat') || queryLower.includes('persiapan') || queryLower.includes('dokumen')) &&
    (queryLower.includes('jenjang') || queryLower.includes('level') || queryLower.includes('sertifikasi') || queryLower.includes('kualifikasi') || queryLower.includes('daftar'))
  ) {
    return {
      text: 'Untuk mengikuti sertifikasi Manajemen Risiko (termasuk Jenjang / Kualifikasi 4) di LSP BSMR, berikut hal dan dokumen yang perlu Anda siapkan:\n\n1. Pendaftaran Akun:\n• Membuat akun dan registrasi jadwal asesmen melalui portal resmi www.bsmr.org atau melalui PIC Bank/Instansi pengirim.\n\n2. Dokumen Persyaratan:\n• Identitas diri resmi (KTP atau Paspor).\n• Surat pengantar/rekomendasi permohonan asesmen resmi dari bank atau instansi kerja Anda.\n• Berkas portofolio dan bukti pengalaman/unjuk kerja di bidang perbankan.\n\n3. Administrasi & Biaya:\n• Biaya sertifikasi uji kompetensi baru Kualifikasi 4 adalah Rp 2.000.000,- (dibayarkan ke rekening resmi PT LSP BSMR di Bank BNI: 2 500 500 330).\n• Bukti transfer pembayaran dan bukti potong PPh 23 (jika ada).\n\n4. Pelaksanaan Asesmen:\n• Hadir 30 menit sebelum jadwal untuk mengikuti Uji Tambahan Tertulis (CBT) serta Uji Portofolio dan Wawancara bersama Asesor.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('asesor') || queryLower.includes('assessor') || queryLower.includes('penguji')) {
    return {
      text: 'Asesor Kompetensi BSMR adalah praktisi atau profesional perbankan bersertifikat dan berlisensi resmi dari BNSP (Badan Nasional Sertifikasi Profesi) serta LSP BSMR.\n\nAsesor bertugas memverifikasi portofolio bukti kerja, menguji pemahaman manajemen risiko, dan menentukan keputusan asesmen (Kompeten atau Belum Kompeten) bagi peserta sertifikasi secara objektif dan independen.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('fast track') || queryLower.includes('akselerasi') || queryLower.includes('tanpa berjenjang')) {
    return {
      text: 'Jalur Fast Track (Akselerasi / Tanpa Berjenjang) adalah skema asesmen sertifikasi Manajemen Risiko BSMR yang memungkinkan peserta langsung mengikuti asesmen pada jenjang tertentu tanpa harus menempuh level di bawahnya secara berurutan.\n\nJalur ini ditujukan bagi profesional atau pejabat perbankan yang telah memiliki kualifikasi atau pengalaman kerja yang setara di bidang perbankan/manajemen risiko dengan portofolio yang terverifikasi oleh LSP BSMR.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('belum kompeten') || queryLower.includes('tidak kompeten') || queryLower.includes('arti bk')) {
    return {
      text: 'Belum Kompeten (BK) adalah hasil keputusan asesmen yang menyatakan bahwa peserta ujian belum memenuhi seluruh kriteria unjuk kerja pada standar kompetensi yang diujikan.\n\nPeserta yang dinyatakan Belum Kompeten berhak mengikuti asesmen ulang (re-asesmen / remedial) pada unit kompetensi yang belum tercapai sesuai jadwal asesmen berikutnya.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('jadwal') || queryLower.includes('kapan') || (queryLower.includes('tanggal') && queryLower.includes('asesmen'))) {
    return {
      text: 'Jadwal Asesmen BSMR terdekat dilaksanakan pada tanggal 12 - 14 September 2026.\n\nPelaksanaan ujian diselenggarakan secara Hybrid (Online via Computer Based Test dan Offline di Kampus BSMR Jakarta).',
      source: 'prompt',
    };
  }

  if (queryLower.includes('perbedaan') || (queryLower.includes('beda') && queryLower.includes('resertifikasi')) || (queryLower.includes('sertifikasi') && queryLower.includes('resertifikasi'))) {
    return {
      text: 'Sertifikasi adalah proses asesmen kompetensi awal untuk memperoleh Sertifikat Manajemen Risiko resmi (berlaku selama 3 tahun).\n\nSedangkan Resertifikasi (Perpanjangan) adalah proses pemeliharaan kompetensi melalui pemenuhan 50 Poin SKP atau asesmen ulang sebelum masa berlaku sertifikat berakhir.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('biaya') || queryLower.includes('harga') || queryLower.includes('tarif')) {
    return {
      text: 'Berikut rincian biaya Ujian Sertifikasi Kompetensi BSMR:\n\n• Kualifikasi 4: Rp 2.000.000,-\n• Kualifikasi 5: Rp 3.000.000,-\n• Kualifikasi 6: Rp 4.500.000,-\n• Kualifikasi 7: Rp 5.500.000,-\n• Akselerasi Fast Track Kualifikasi 6: Rp 7.000.000,-\n• Akselerasi Fast Track Kualifikasi 7: Rp 9.500.000,-\n\nPembayaran ditransfer ke rekening resmi PT LSP BSMR di Bank BNI: 2 500 500 330.',
      source: 'prompt',
    };
  }

  if (queryLower.includes('perpanjang') || queryLower.includes('skp') || queryLower.includes('maintenance')) {
    return {
      text: 'Perpanjangan Sertifikat BSMR dilakukan setiap 3 tahun sekali.\n\nPemegang sertifikat diwajibkan memenuhi 50 Poin SKP melalui kegiatan industri perbankan atau pelatihan resmi terakreditasi BSMR.',
      source: 'prompt',
    };
  }

  if (
    queryLower.includes('ada berapa jenjang') ||
    queryLower.includes('ada berapa level') ||
    queryLower.includes('berapa jenjang') ||
    queryLower.includes('berapa level') ||
    queryLower.includes('jenjang sertifikasi') ||
    queryLower.includes('level sertifikasi') ||
    queryLower.includes('apa saja jenjang') ||
    queryLower.includes('apa saja level') ||
    queryLower.includes('daftar jenjang') ||
    queryLower.includes('daftar level') ||
    queryLower.includes('tingkatan sertifikasi') ||
    queryLower === 'jenjang' ||
    queryLower === 'level'
  ) {
    return {
      text: 'LSP BSMR menyelenggarakan sertifikasi kompetensi Manajemen Risiko Perbankan dalam 5 jenjang kualifikasi utama:\n\n• Level 1: Tingkat Dasar / Pelaksana (Staff)\n• Level 2: Tingkat Menengah (Officer / Supervisor)\n• Level 3: Tingkat Lanjutan (Manager)\n• Level 4: Tingkat Manajemen Senior (VP / General Manager)\n• Level 5: Tingkat Eksekutif (Direksi & Dewan Komisaris)\n\nSelain itu, BSMR juga menyediakan skema Fast Track (Tanpa Berjenjang) khusus untuk Kualifikasi 6 dan Kualifikasi 7 bagi calon Direksi atau Dewan Komisaris yang memenuhi kualifikasi pengalaman kerja perbankan.',
      source: 'prompt',
    };
  }

  // 5C. Jika ada chunk RAG yang bersih dan relevan (bukan cover/header dokumen)
  if (
    ragFallbackSnippet &&
    !ragFallbackSnippet.includes('DATA OPERASIONAL UMUM') &&
    !ragFallbackSnippet.includes('K.64MRP') &&
    !ragFallbackSnippet.includes('Ringkasan biaya sertifikasi') &&
    ragFallbackSnippet.length > 25
  ) {
    return { text: cleanAndFormatResponse(ragFallbackSnippet, filterWordsList), source: 'rag' };
  }

  // 5D. Respon Cerdas Ringkas & Sopan untuk Pertanyaan di Luar Konteks / Database
  return {
    text: 'Mohon maaf, informasi mengenai pertanyaan tersebut belum tercantum dalam basis data resmi kami.\n\nSilakan pilih topik pertanyaan populer di bawah atau hubungi Admin CS BSMR melalui WhatsApp/Email resmi untuk bantuan lebih lanjut.',
    source: 'fallback',
  };
}

