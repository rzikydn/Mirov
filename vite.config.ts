/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath, URL } from 'url';

function chatSyncPlugin(): Plugin {
  let serverSessions: any[] = [];
  let serverDeletedIds = new Set<string>();
  let serverSettings: any = null;
  let serverAiConfig: any = null;

  let serverPeakHours: any[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    chat: 0,
    capacity: 80,
  }));

  let serverTopQuestions: any[] = [
    {
      id: "jadwal-asesmen",
      label: "Jadwal & Lokasi Asesmen",
      count: 0,
      color: "hsl(214.7 95% 40%)",
      keywords: ["jadwal", "kapan", "asesmen", "ujian", "level", "tanggal", "periode", "lokasi", "tempat", "cbt"],
    },
    {
      id: "perpanjangan-sertifikat",
      label: "Mekanisme Perpanjangan",
      count: 0,
      color: "hsl(142.1 76.2% 36.3%)",
      keywords: ["perpanjang", "perpanjangan", "expired", "habis", "mekanisme", "re-sertifikasi", "renew", "masa berlaku", "tenggat"],
    },
    {
      id: "biaya-pendaftaran",
      label: "Rincian Biaya & Pendaftaran",
      count: 0,
      color: "hsl(47.9 95.8% 53.1%)",
      keywords: ["biaya", "harga", "tarif", "bayar", "rincian", "ppn", "daftar", "pendaftaran", "rekening", "registrasi"],
    },
    {
      id: "skp-maintenance",
      label: "Syarat Poin SKP Maintenance",
      count: 0,
      color: "hsl(262.1 83.3% 57.8%)",
      keywords: ["skp", "poin", "kredit", "maintenance", "pemeliharaan", "syarat poin", "kredit poin"],
    },
    {
      id: "persyaratan-berkas",
      label: "Persyaratan & Dokumen",
      count: 0,
      color: "hsl(0 0% 63.9%)",
      keywords: ["syarat", "persyaratan", "berkas", "dokumen", "umum", "kualifikasi", "ijazah", "ktp", "pas foto"],
    },
    {
      id: "informasi-bsmr",
      label: "Informasi Umum BSMR",
      count: 0,
      color: "hsl(198 93% 60%)",
      keywords: ["apa itu", "bsmr", "lembaga", "ojk", "bnsp", "profil", "tentang"],
    },
    {
      id: "eskalasi-admin",
      label: "Eskalasi CS Admin",
      count: 0,
      color: "hsl(340 82% 52%)",
      keywords: ["admin", "cs", "obrol", "mengobrol", "hubungi", "operator", "bantuan", "pesan"],
    },
  ];

  const LEGACY_TEST_IDS = [
    "#5887", "#5589", "#4092", "#4088", "#4075", "#8246", "#2907", "#3309", "#7880", "#2295", "#9060", "#6718", "#6576",
    "#8319", "#6837", "#6332", "#5628", "#5239", "#8284", "#5362", "#4662",
    "#9585", "#9443", "#2281", "#6543", "#5871", "#3840", "#7091"
  ];
  const EXACT_LEGACY_IDS = new Set(["session-1", "session-2", "session-3", "session-esc-1", "session-esc-2"]);

  function isSessionDeleted(s: any): boolean {
    if (!s) return true;
    if (EXACT_LEGACY_IDS.has(s.id)) return true;
    if (LEGACY_TEST_IDS.includes(s.visitorId)) return true;
    if (serverDeletedIds.has(s.id) || serverDeletedIds.has(s.visitorId)) return true;
    return false;
  }

  function computePeakHoursServer(sessions: any[]): any[] {
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      chat: 0,
      capacity: 80,
    }));
    if (!Array.isArray(sessions)) return buckets;
    for (const session of sessions) {
      if (!session || isSessionDeleted(session) || !Array.isArray(session.messages)) continue;
      for (const m of session.messages) {
        if (m && m.sender === 'user') {
          let hour = -1;
          if (m.time) {
            const match = m.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (match) {
              let h = parseInt(match[1], 10);
              const isPM = match[3] && match[3].toUpperCase() === 'PM';
              const isAM = match[3] && match[3].toUpperCase() === 'AM';
              if (isPM && h < 12) h += 12;
              if (isAM && h === 12) h = 0;
              if (h >= 0 && h <= 23) hour = h;
            }
          }
          if (hour === -1 && session.timestamp) {
            hour = new Date(session.timestamp).getHours();
          }
          if (hour >= 0 && hour < 24) {
            buckets[hour].chat += 1;
          }
        }
      }
    }
    return buckets;
  }

  function computeTopQuestionsServer(sessions: any[]): any[] {
    const defaultCats = [
      {
        id: "jadwal-asesmen",
        label: "Jadwal & Lokasi Asesmen",
        count: 0,
        color: "hsl(214.7 95% 40%)",
        keywords: ["jadwal", "kapan", "asesmen", "ujian", "level", "tanggal", "periode", "lokasi", "tempat", "cbt"],
      },
      {
        id: "perpanjangan-sertifikat",
        label: "Mekanisme Perpanjangan",
        count: 0,
        color: "hsl(142.1 76.2% 36.3%)",
        keywords: ["perpanjang", "perpanjangan", "expired", "habis", "mekanisme", "re-sertifikasi", "renew", "masa berlaku", "tenggat"],
      },
      {
        id: "biaya-pendaftaran",
        label: "Rincian Biaya & Pendaftaran",
        count: 0,
        color: "hsl(47.9 95.8% 53.1%)",
        keywords: ["biaya", "harga", "tarif", "bayar", "rincian", "ppn", "daftar", "pendaftaran", "rekening", "registrasi"],
      },
      {
        id: "skp-maintenance",
        label: "Syarat Poin SKP Maintenance",
        count: 0,
        color: "hsl(262.1 83.3% 57.8%)",
        keywords: ["skp", "poin", "kredit", "maintenance", "pemeliharaan", "syarat poin", "kredit poin"],
      },
      {
        id: "persyaratan-berkas",
        label: "Persyaratan & Dokumen",
        count: 0,
        color: "hsl(0 0% 63.9%)",
        keywords: ["syarat", "persyaratan", "berkas", "dokumen", "umum", "kualifikasi", "ijazah", "ktp", "pas foto"],
      },
      {
        id: "informasi-bsmr",
        label: "Informasi Umum BSMR",
        count: 0,
        color: "hsl(198 93% 60%)",
        keywords: ["apa itu", "bsmr", "lembaga", "ojk", "bnsp", "profil", "tentang"],
      },
      {
        id: "eskalasi-admin",
        label: "Eskalasi CS Admin",
        count: 0,
        color: "hsl(340 82% 52%)",
        keywords: ["admin", "cs", "obrol", "mengobrol", "hubungi", "operator", "bantuan", "pesan"],
      },
    ];

    const categories = defaultCats.map(c => ({ ...c, count: 0 }));
    if (!Array.isArray(sessions)) return categories;

    for (const session of sessions) {
      if (!session || isSessionDeleted(session) || !Array.isArray(session.messages)) continue;
      for (const m of session.messages) {
        if (m && m.sender === 'user' && m.text) {
          const text = m.text.toLowerCase().trim();
          let bestIdx = -1;
          let highestScore = 0;

          categories.forEach((cat, idx) => {
            let score = 0;
            cat.keywords.forEach((kw) => {
              if (text.includes(kw.toLowerCase())) score += 1;
            });
            if (score > highestScore) {
              highestScore = score;
              bestIdx = idx;
            }
          });

          if (bestIdx !== -1 && highestScore > 0) {
            categories[bestIdx].count += 1;
          } else {
            const fallbackIdx = categories.findIndex((c) => c.id === "informasi-bsmr");
            if (fallbackIdx >= 0) categories[fallbackIdx].count += 1;
            else categories[0].count += 1;
          }
        }
      }
    }

    categories.sort((a, b) => b.count - a.count);
    return categories;
  }

  return {
    name: 'chat-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.url && req.url.startsWith('/api/top-questions')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            const valid = serverSessions.filter(s => !isSessionDeleted(s));
            const computed = computeTopQuestionsServer(valid);
            return res.end(JSON.stringify(computed));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  serverTopQuestions = parsed;
                }
              } catch (e) { }
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, data: serverTopQuestions }));
            });
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/peak-hours')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            const valid = serverSessions.filter(s => !isSessionDeleted(s));
            const computed = computePeakHoursServer(valid);
            return res.end(JSON.stringify(computed));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed) && parsed.length === 24) {
                  serverPeakHours = parsed.map((b: any) => ({ ...b, capacity: 80 }));
                }
              } catch (e) { }
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, data: serverPeakHours }));
            });
            return;
          }
        }

        if (req.url === '/api/ai-config') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(serverAiConfig || {}));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed && typeof parsed === 'object') {
                  serverAiConfig = parsed;
                }
              } catch (e) { }
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, config: serverAiConfig }));
            });
            return;
          }
        }

        if (req.url === '/api/chatbot-settings') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(serverSettings || {}));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed && typeof parsed === 'object') {
                  serverSettings = parsed;
                }
              } catch (e) { }
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, settings: serverSettings }));
            });
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/visitor-chat-sessions')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            const valid = serverSessions.filter(s => !isSessionDeleted(s));
            return res.end(JSON.stringify(valid));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  if (parsed.action === 'DELETE' && Array.isArray(parsed.deletedIds)) {
                    parsed.deletedIds.forEach((id: string) => serverDeletedIds.add(id));
                    serverSessions = serverSessions.filter(s => !isSessionDeleted(s));
                  } else if (parsed.action === 'CLEAR') {
                    serverSessions = [];
                  }
                } else if (Array.isArray(parsed)) {
                  if (parsed.length === 0) {
                    serverSessions = [];
                  } else {
                    const cleanIncoming = parsed.filter(s => !isSessionDeleted(s));

                    const sessionMap = new Map();
                    for (const s of serverSessions) {
                      if (s && s.id && !isSessionDeleted(s)) {
                        sessionMap.set(s.id, s);
                      }
                    }
                    for (const newS of cleanIncoming) {
                      if (!newS || !newS.id || isSessionDeleted(newS)) continue;
                      if (sessionMap.has(newS.id)) {
                        const existing = sessionMap.get(newS.id);
                        const msgMap = new Map();
                        for (const m of (existing.messages || [])) {
                          if (m) msgMap.set(m.id || m.text, m);
                        }
                        for (const m of (newS.messages || [])) {
                          if (m) msgMap.set(m.id || m.text, m);
                        }
                        const mergedMessages = Array.from(msgMap.values());
                        sessionMap.set(newS.id, {
                          ...existing,
                          ...newS,
                          messages: mergedMessages
                        });
                      } else {
                        sessionMap.set(newS.id, newS);
                      }
                    }
                    serverSessions = Array.from(sessionMap.values()).filter(s => !isSessionDeleted(s));
                  }
                }
              } catch (e) { }
              const adminMsgCount = serverSessions.reduce((n, s) => n + (s.messages || []).filter((m: any) => m.sender === 'admin').length, 0);
              console.log(`[API POST] sessions=${serverSessions.length}, adminMsgs=${adminMsgCount}`);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, count: serverSessions.length }));
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), svgr(), chatSyncPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
