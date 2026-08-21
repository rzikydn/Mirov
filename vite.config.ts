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

        if (req.url && req.url.startsWith('/api/peak-hours')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            const sanitized = serverPeakHours.map((b: any) => ({ ...b, capacity: 80 }));
            return res.end(JSON.stringify(sanitized));
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
              } catch (e) {}
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
              } catch (e) {}
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
              } catch (e) {}
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
              } catch (e) {}
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
