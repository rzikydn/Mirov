/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath, URL } from 'url';

function chatSyncPlugin(): Plugin {
  let serverSessions: any[] = [];

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

        if (req.url === '/api/visitor-chat-sessions') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(serverSessions));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  if (parsed.length === 0) {
                    serverSessions = [];
                  } else {
                    const parsedIds = new Set(parsed.map(s => s ? s.id : null).filter(Boolean));
                    const sessionMap = new Map();
                    for (const s of serverSessions) {
                      if (s && s.id && parsedIds.has(s.id)) {
                        sessionMap.set(s.id, s);
                      }
                    }
                    for (const newS of parsed) {
                      if (!newS || !newS.id) continue;
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
                    serverSessions = Array.from(sessionMap.values());
                  }
                }
              } catch (e) {}
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
