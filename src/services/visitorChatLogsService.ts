// Visitor Chat Logs Service for Admin Escalation & Real-Time Sync

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  time: string;
}

export interface ChatSession {
  id: string;
  visitorId: string;
  location: string;
  topic: string;
  time: string;
  dateStr: string;
  satisfied: boolean;
  statusText: string;
  accuracy: number;
  summary: string;
  messages: ChatMessage[];
  isEscalated?: boolean;
  isUnread?: boolean;
  timestamp?: number;
}

const STORAGE_KEY = 'bsmr_visitor_chat_sessions';
const DELETED_IDS_KEY = 'bsmr_deleted_visitor_session_ids';
const READ_IDS_KEY = 'bsmr_read_visitor_session_ids';

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [];

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';
const BACKEND_SESSIONS_API_URL = `${API_BASE}/api/chatbot/sessions`;
const VITE_SESSIONS_API_URL = import.meta.env.DEV ? '/api/visitor-chat-sessions' : '';
const SYNC_API_URL = VITE_SESSIONS_API_URL;
let cachedSessions: ChatSession[] = [];
let hasInitialized = false;

// Purge Semua Sesi Test Lama secara Otomatis agar Demo & Production Mulai Bersih (Clean Slate)
const LEGACY_TEST_IDS = [
  "#5887", "#5589", "#4092", "#4088", "#4075", "#8246", "#2907", "#3309", "#7880", "#2295", "#9060", "#6718", "#6576",
  "#8319", "#6837", "#6332", "#5628", "#5239", "#8284", "#5362", "#4662",
  "#9585", "#9443", "#2281", "#6543", "#5871", "#3840", "#7091"
];

const EXACT_LEGACY_IDS = new Set(["session-1", "session-2", "session-3", "session-esc-1", "session-esc-2"]);

export function getReadSessionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const data = localStorage.getItem(READ_IDS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

export function markSessionIdAsRead(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getReadSessionIds();
    set.add(id);
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function unmarkSessionIdAsRead(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getReadSessionIds();
    set.delete(id);
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function getDeletedSessionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const data = localStorage.getItem(DELETED_IDS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

export function markSessionsAsDeleted(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedSessionIds();
    ids.forEach((id) => {
      if (id) set.add(id);
    });
    const arr = Array.from(set);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(arr));

    // Send to server deleted sync
    if (SYNC_API_URL) {
      fetch(SYNC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', deletedIds: arr }),
      }).catch(() => {});
    }
  } catch (e) {}
}

function filterOutLegacySessions(sessions: ChatSession[]): ChatSession[] {
  if (!Array.isArray(sessions)) return [];
  const deletedSet = getDeletedSessionIds();
  const readSet = getReadSessionIds();
  return sessions
    .filter(
      (s) =>
        s &&
        s.id &&
        !LEGACY_TEST_IDS.includes(s.visitorId) &&
        !EXACT_LEGACY_IDS.has(s.id) &&
        !deletedSet.has(s.id) &&
        !deletedSet.has(s.visitorId)
    )
    .map((s) => {
      const isRead = s && (readSet.has(s.id) || readSet.has(s.visitorId));
      return {
        ...s,
        isUnread: isRead ? false : (s.isUnread !== false),
      };
    });
}

export function extractTimestampFromSession(s: ChatSession): number {
  if (!s) return 0;
  if (typeof s.timestamp === 'number' && !isNaN(s.timestamp) && s.timestamp > 0) {
    return s.timestamp;
  }
  if (s.id && typeof s.id === 'string' && s.id.includes('-')) {
    const parts = s.id.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > 1000000000000) {
      return num;
    }
  }
  if (s.time) {
    const timeMatch = s.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      let calculatedTime = today.getTime();
      // If calculated time is in the future relative to current time, it refers to yesterday!
      if (calculatedTime > Date.now() + 60000) {
        calculatedTime -= 24 * 60 * 60 * 1000;
      }
      return calculatedTime;
    }
  }
  return 0;
}

export function sortSessionsDescending(sessions: ChatSession[]): ChatSession[] {
  if (!Array.isArray(sessions)) return [];
  const filtered = filterOutLegacySessions(sessions);
  return [...filtered].sort((a, b) => {
    const tA = extractTimestampFromSession(a);
    const tB = extractTimestampFromSession(b);
    if (tB !== tA) {
      return tB - tA; // Newest / latest timestamp at the very top!
    }
    return 0;
  });
}

export function getVisitorChatSessions(): ChatSession[] {
  try {
    const data = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const cleaned = sortSessionsDescending(parsed);
        cachedSessions = cleaned;
        hasInitialized = true;
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Failed to load visitor chat sessions:', e);
  }
  cachedSessions = sortSessionsDescending(cachedSessions);
  hasInitialized = true;
  return cachedSessions;
}

export async function fetchVisitorChatSessionsAsync(): Promise<ChatSession[]> {
  // 1. Coba dari Backend Express MySQL
  try {
    const res = await fetch(`${BACKEND_SESSIONS_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : null);
      if (data && Array.isArray(data) && data.length > 0) {
        const normalized: ChatSession[] = data.map((s: any) => {
          const hasEscMsg = Array.isArray(s.messages) && s.messages.some((m: any) => m.isEscalation || m.sender === 'admin');
          const isEsc = Boolean(s.isEscalated === true || hasEscMsg);
          return {
            ...s,
            isEscalated: isEsc,
            satisfied: !isEsc,
            statusText: isEsc ? "Pengguna meminta terhubung dengan admin" : "",
            summary: isEsc
              ? "Pengguna meminta terhubung dengan admin"
              : `Pengunjung sedang berinteraksi dengan AI Chatbot (${(s.messages || []).length} pesan)`,
            topic: s.topic || s.title || "Pengunjung Membuka Widget AI",
            location: s.location || "Jakarta",
            time: s.time || (s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Hari ini"),
            dateStr: s.dateStr || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"),
            messages: Array.isArray(s.messages) ? s.messages : [],
          };
        });
        const cleaned = sortSessionsDescending(normalized);
        cachedSessions = cleaned;
        hasInitialized = true;
        for (const s of cleaned) {
          if (s && s.id && Array.isArray(s.messages)) {
            const adminMsgs = s.messages.filter((m) => m.sender === "admin");
            if (adminMsgs.length > 0) {
              _serverAdminMsgCache.set(s.id, adminMsgs);
            }
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {}

  // 2. Fallback ke Vite Dev Server API
  if (VITE_SESSIONS_API_URL) {
    try {
      const cacheBustUrl = `${VITE_SESSIONS_API_URL}?_t=${Date.now()}`;
      const res = await fetch(cacheBustUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized: ChatSession[] = data.map((s: any) => {
            const hasEscMsg = Array.isArray(s.messages) && s.messages.some((m: any) => m.isEscalation || m.sender === 'admin');
            const isEsc = Boolean(s.isEscalated === true || hasEscMsg);
            return {
              ...s,
              isEscalated: isEsc,
              satisfied: !isEsc,
              statusText: isEsc ? "Pengguna meminta terhubung dengan admin" : "",
              summary: isEsc
                ? "Pengguna meminta terhubung dengan admin"
                : `Pengunjung sedang berinteraksi dengan AI Chatbot (${(s.messages || []).length} pesan)`,
              topic: s.topic || s.title || "Pengunjung Membuka Widget AI",
              location: s.location || "Jakarta",
              time: s.time || (s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Hari ini"),
              dateStr: s.dateStr || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"),
              messages: Array.isArray(s.messages) ? s.messages : [],
            };
          });
          const cleaned = sortSessionsDescending(normalized);
          cachedSessions = cleaned;
          hasInitialized = true;
          // Cache admin messages from server for cross-origin preservation
          for (const s of cleaned) {
            if (s && s.id && Array.isArray(s.messages)) {
              const adminMsgs = s.messages.filter((m) => m.sender === "admin");
              if (adminMsgs.length > 0) {
                _serverAdminMsgCache.set(s.id, adminMsgs);
              }
            }
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {}
  }
  return getVisitorChatSessions();
}

const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel('bsmr_chat_sync_channel');
    } catch (e) {
      return null;
    }
  }
  return null;
};

export function saveVisitorChatSessions(sessions: ChatSession[]): void {
  try {
    const cleaned = sortSessionsDescending(sessions);
    cachedSessions = cleaned;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
    }
    
    // Broadcast via BroadcastChannel across same-origin tabs/windows
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: 'CHAT_LOGS_UPDATED', sessions: cleaned });
      channel.close();
    }

    // Broadcast via postMessage if running inside iframe to parent window
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'BSMR_CHAT_LOGS_UPDATED', sessions: cleaned }, '*');
    }

    // HTTP Sync POST ke Backend Express MySQL API
    for (const session of cleaned) {
      fetch(BACKEND_SESSIONS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      }).catch(() => {});
    }

    // HTTP Sync POST to Vite API fallback
    if (VITE_SESSIONS_API_URL) {
      fetch(VITE_SESSIONS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to save visitor chat sessions:', e);
  }
}

// ponytail: cache admin messages fetched from API server, so cross-origin saves don't lose them
let _serverAdminMsgCache: Map<string, ChatMessage[]> = new Map();

/**
 * Update the admin messages cache for a session (called from fetchVisitorChatSessionsAsync / widget sync)
 */
export function cacheServerAdminMessages(sessionId: string, adminMessages: ChatMessage[]): void {
  if (sessionId && adminMessages.length > 0) {
    _serverAdminMsgCache.set(sessionId, adminMessages);
  }
}

/**
 * Menyimpan atau memperbarui sesi obrolan pengunjung aktif secara real-time
 */
export function saveOrUpdateUserSession(
  sessionId: string,
  userMessages: ChatMessage[],
  customTopic?: string,
  isEscalated = false
): ChatSession {
  const sessions = getVisitorChatSessions();
  const existingIdx = sessions.findIndex((s) => s.id === sessionId || s.visitorId === sessionId);

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const cities = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Yogyakarta"];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];

  const firstUserMsg = userMessages.find((m) => m.sender === "user");
  const inferredTopic = customTopic || (firstUserMsg ? (firstUserMsg.text.length > 35 ? firstUserMsg.text.slice(0, 35) + "..." : firstUserMsg.text) : "Pengunjung Membuka Widget AI");

  const formattedMessages: ChatMessage[] = userMessages.map((m) => ({
    id: m.id,
    sender: m.sender as "user" | "bot" | "admin",
    text: m.text,
    time: m.time,
  }));

  const existingSession = existingIdx >= 0 ? sessions[existingIdx] : null;
  const hasEscMsg = userMessages.some((m) => m.isEscalation || m.sender === "admin");
  const currentlyEscalated = Boolean(isEscalated || hasEscMsg || (existingSession && existingSession.isEscalated === true));

  // Preserve existing admin messages from ALL sources: localStorage + server cache
  let finalMessages = formattedMessages;

  // Collect all known admin messages from localStorage session AND server cache
  const allKnownAdminMsgs: ChatMessage[] = [];
  if (existingSession && Array.isArray(existingSession.messages)) {
    allKnownAdminMsgs.push(...existingSession.messages.filter((m) => m.sender === "admin"));
  }
  // Also check server admin cache (critical for cross-origin: 127.0.0.1:8080 <-> localhost:5173)
  const cachedAdminMsgs = _serverAdminMsgCache.get(sessionId);
  if (cachedAdminMsgs) {
    allKnownAdminMsgs.push(...cachedAdminMsgs);
  }

  if (allKnownAdminMsgs.length > 0) {
    const currentAdminMsgIds = new Set(formattedMessages.filter((m) => m.sender === "admin").map((m) => m.id));
    const currentAdminMsgTexts = new Set(formattedMessages.filter((m) => m.sender === "admin").map((m) => m.text.trim()));

    // Deduplicate admin messages
    const adminMsgMap = new Map<string, ChatMessage>();
    for (const m of allKnownAdminMsgs) {
      if (!currentAdminMsgIds.has(m.id) && !currentAdminMsgTexts.has(m.text.trim())) {
        adminMsgMap.set(m.id || m.text, m);
      }
    }
    const missingAdminMsgs = Array.from(adminMsgMap.values());

    if (missingAdminMsgs.length > 0) {
      finalMessages = [...formattedMessages, ...missingAdminMsgs];
    }
  }

  const statusText = currentlyEscalated
    ? "Pengguna meminta terhubung dengan admin"
    : "";

  const previousMsgCount = existingSession
    ? (existingSession.messages || []).length
    : 0;
  const currentMsgCount = formattedMessages.length;
  const isNewMessageArrived = currentMsgCount > previousMsgCount;

  if (isNewMessageArrived && existingSession) {
    unmarkSessionIdAsRead(sessionId);
    if (existingSession.visitorId) unmarkSessionIdAsRead(existingSession.visitorId);
  }

  const readSet = getReadSessionIds();
  const isMarkedRead = readSet.has(sessionId) || (existingSession && readSet.has(existingSession.visitorId));

  let finalIsUnread = true;
  if (existingSession) {
    if (isNewMessageArrived) {
      finalIsUnread = true;
    } else {
      finalIsUnread = isMarkedRead ? false : (existingSession.isUnread !== false);
    }
  } else {
    finalIsUnread = !isMarkedRead;
  }

  const sessionObj: ChatSession = {
    id: sessionId,
    visitorId: existingSession ? existingSession.visitorId : `#${randomNum}`,
    location: existingSession ? existingSession.location : randomCity,
    topic: inferredTopic,
    time: `Hari ini, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    satisfied: !currentlyEscalated,
    statusText: statusText,
    isEscalated: currentlyEscalated,
    accuracy: 98,
    summary: currentlyEscalated
      ? "Pengguna meminta terhubung dengan admin"
      : `Pengunjung sedang berinteraksi dengan AI Chatbot (${finalMessages.length} pesan)`,
    isUnread: finalIsUnread,
    timestamp: Date.now(),
    messages: finalMessages,
  };

  let updatedSessions: ChatSession[];
  if (existingIdx >= 0) {
    updatedSessions = [...sessions];
    updatedSessions.splice(existingIdx, 1);
    updatedSessions.unshift(sessionObj);
  } else {
    updatedSessions = [sessionObj, ...sessions];
  }

  saveVisitorChatSessions(updatedSessions);
  return sessionObj;
}

/**
 * Membuat atau memperbarui sesi obrolan eskalasi saat pengguna mengklik "Mengobrol Dengan Admin"
 */
export function escalateSessionToAdmin(
  userHistory: ChatMessage[],
  currentTopic = "Eskalasi Pertanyaan CS Admin",
  sessionId?: string
): ChatSession {
  if (sessionId) {
    return saveOrUpdateUserSession(sessionId, userHistory, currentTopic, true);
  }
  const tempId = `session-esc-${Date.now()}`;
  return saveOrUpdateUserSession(tempId, userHistory, currentTopic, true);
}

/**
 * Balasan dari User Admin di Dashboard Chat Logs untuk dikirimkan kembali ke sesi visitor
 */
export function sendAdminReplyToSession(sessionId: string, replyText: string): void {
  const localSessions = getVisitorChatSessions();
  const sessionMap = new Map<string, ChatSession>();
  for (const s of cachedSessions) if (s && s.id) sessionMap.set(s.id, s);
  for (const s of localSessions) if (s && s.id) sessionMap.set(s.id, s);
  const sessions = Array.from(sessionMap.values());

  let matchedVisitorId = "";
  let matchedSessionId = sessionId;

  const updated = sessions.map((session) => {
    if (session.id === sessionId || session.visitorId === sessionId) {
      matchedSessionId = session.id;
      matchedVisitorId = session.visitorId;
      const adminMsg: ChatMessage = {
        id: `admin-reply-${Date.now()}`,
        sender: "admin",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...session,
        timestamp: Date.now(),
        messages: [...(session.messages || []), adminMsg],
      };
    }
    return session;
  });

  saveVisitorChatSessions(updated);

  // Cache admin reply so cross-origin saveOrUpdateUserSession doesn't lose it
  const matchedSession = updated.find(s => s.id === matchedSessionId);
  if (matchedSession) {
    const allAdminMsgs = matchedSession.messages.filter(m => m.sender === "admin");
    cacheServerAdminMessages(matchedSessionId, allAdminMsgs);
  }

  const payload = { sessionId: matchedSessionId, visitorId: matchedVisitorId, replyText };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bsmr_admin_replied_to_chat', { detail: payload }));
    window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
  }

  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: 'ADMIN_REPLIED', ...payload });
    channel.postMessage({ type: 'CHAT_LOGS_UPDATED', sessions: updated });
    channel.close();
  }

  if (typeof window !== 'undefined') {
    window.postMessage({ type: 'BSMR_ADMIN_REPLIED', ...payload }, '*');
    window.postMessage({ type: 'BSMR_CHAT_LOGS_UPDATED', sessions: updated }, '*');
  }
}

/**
 * Menambahkan pesan tambahan dari visitor ke sesi yang sedang ter-eskalasi
 */
export function addVisitorMessageToEscalatedSession(sessionId: string, messageText: string): void {
  const sessions = getVisitorChatSessions();
  const updated = sessions.map((session) => {
    if (session.id === sessionId) {
      const userMsg: ChatMessage = {
        id: `user-msg-${Date.now()}`,
        sender: "user",
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...session,
        timestamp: Date.now(),
        messages: [...session.messages, userMsg],
      };
    }
    return session;
  });

  saveVisitorChatSessions(updated);
}

/**
 * Menandai sesi obrolan sebagai sudah dibaca (isUnread: false) dan menyimpannya secara terpusat
 */
export function markSessionAsReadInService(sessionId: string): ChatSession[] {
  if (!sessionId) return getVisitorChatSessions();
  markSessionIdAsRead(sessionId);

  const sessions = getVisitorChatSessions();
  let hasChanged = false;
  const updated = sessions.map((session) => {
    if (
      (session.id === sessionId || session.visitorId === sessionId || sessionId === 'all')
    ) {
      if (session.id) markSessionIdAsRead(session.id);
      if (session.visitorId) markSessionIdAsRead(session.visitorId);
      if (session.isUnread !== false) {
        hasChanged = true;
        return {
          ...session,
          isUnread: false,
        };
      }
    }
    return session;
  });

  if (hasChanged) {
    saveVisitorChatSessions(updated);
  }
  return updated;
}

/**
 * Mendapatkan jumlah sesi obrolan pengunjung yang belum dibaca (isUnread: true)
 */
export function getUnreadVisitorChatSessionsCount(): number {
  try {
    const sessions = getVisitorChatSessions();
    if (Array.isArray(sessions)) {
      return sessions.filter((s) => s && s.isUnread !== false).length;
    }
  } catch (e) {}
  return 0;
}

/**
 * Menghapus satu sesi obrolan pengunjung berdasarkan ID
 */
export function deleteVisitorChatSession(sessionId: string): ChatSession[] {
  const sessions = getVisitorChatSessions();
  const target = sessions.find((s) => s.id === sessionId);
  const idsToDelete = [sessionId];
  if (target && target.visitorId) idsToDelete.push(target.visitorId);

  markSessionsAsDeleted(idsToDelete);

  const updated = sessions.filter((s) => s.id !== sessionId && s.visitorId !== target?.visitorId);
  saveVisitorChatSessions(updated);
  return updated;
}

/**
 * Menghapus banyak sesi obrolan pengunjung sekaligus (Bulk Delete)
 */
export function deleteBulkVisitorChatSessions(sessionIds: string[]): ChatSession[] {
  const sessions = getVisitorChatSessions();
  const idsToDelete: string[] = [...sessionIds];
  sessionIds.forEach((id) => {
    const target = sessions.find((s) => s.id === id);
    if (target && target.visitorId) idsToDelete.push(target.visitorId);
  });

  markSessionsAsDeleted(idsToDelete);

  const setIds = new Set(idsToDelete);
  const updated = sessions.filter((s) => !setIds.has(s.id) && !setIds.has(s.visitorId));
  saveVisitorChatSessions(updated);
  return updated;
}

/**
 * Menghapus seluruh log chat pengunjung (Clear All)
 */
export function clearAllVisitorChatSessions(): ChatSession[] {
  const sessions = getVisitorChatSessions();
  const allIds: string[] = [];
  sessions.forEach((s) => {
    if (s.id) allIds.push(s.id);
    if (s.visitorId) allIds.push(s.visitorId);
  });

  markSessionsAsDeleted(allIds);
  saveVisitorChatSessions([]);
  return [];
}

