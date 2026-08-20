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
  isUnread?: boolean;
}

const STORAGE_KEY = 'bsmr_visitor_chat_sessions';

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [];

const SYNC_API_URL = 'http://localhost:5173/api/visitor-chat-sessions';
let cachedSessions: ChatSession[] = [];
let hasInitialized = false;

// Purge Semua Sesi Test Lama secara Otomatis agar Demo & Production Mulai Bersih (Clean Slate)
const LEGACY_TEST_IDS = [
  "#4092", "#4088", "#4075", "#8246", "#2907", "#3309", "#7880", "#2295", "#9060", "#6718", "#6576",
  "#8319", "#6837", "#6332", "#5628", "#5239", "#8284", "#5362", "#4662",
  "#9585", "#9443", "#2281", "#6543", "#5871", "#3840", "#7091"
];

const EXACT_LEGACY_IDS = new Set(["session-1", "session-2", "session-3", "session-esc-1", "session-esc-2"]);

function filterOutLegacySessions(sessions: ChatSession[]): ChatSession[] {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter(
    (s) => !LEGACY_TEST_IDS.includes(s.visitorId) && !EXACT_LEGACY_IDS.has(s.id)
  );
}

export function getVisitorChatSessions(): ChatSession[] {
  if (hasInitialized) {
    return cachedSessions;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const cleaned = filterOutLegacySessions(parsed);
        cachedSessions = cleaned;
        hasInitialized = true;
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Failed to load visitor chat sessions:', e);
  }
  cachedSessions = [];
  hasInitialized = true;
  return [];
}

export async function fetchVisitorChatSessionsAsync(): Promise<ChatSession[]> {
  try {
    const res = await fetch(SYNC_API_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const cleaned = filterOutLegacySessions(data);
        cachedSessions = cleaned;
        hasInitialized = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
        return cleaned;
      }
    }
  } catch (e) {
    // Silently fallback
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
    const cleaned = filterOutLegacySessions(sessions);
    cachedSessions = cleaned;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
    
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

    // HTTP Sync POST to Vite API for cross-domain / cross-port support (127.0.0.1:8080 <-> localhost:5173)
    fetch(SYNC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save visitor chat sessions:', e);
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
  const existingIdx = sessions.findIndex((s) => s.id === sessionId);

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const cities = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Yogyakarta"];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];

  const firstUserMsg = userMessages.find((m) => m.sender === "user");
  const inferredTopic = customTopic || (firstUserMsg ? (firstUserMsg.text.length > 35 ? firstUserMsg.text.slice(0, 35) + "..." : firstUserMsg.text) : "Pengunjung Membuka Widget AI");

  const formattedMessages: ChatMessage[] = userMessages.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    time: m.time,
  }));

  const existingSession = existingIdx >= 0 ? sessions[existingIdx] : null;
  const currentlyEscalated = existingSession ? (!existingSession.satisfied || isEscalated) : isEscalated;

  // Preserve existing admin messages so widget auto-sync doesn't overwrite admin replies
  let finalMessages = formattedMessages;
  if (existingSession && Array.isArray(existingSession.messages)) {
    const existingAdminMsgs = existingSession.messages.filter((m) => m.sender === "admin");
    const currentAdminMsgIds = new Set(formattedMessages.filter((m) => m.sender === "admin").map((m) => m.id));
    const currentAdminMsgTexts = new Set(formattedMessages.filter((m) => m.sender === "admin").map((m) => m.text));

    const missingAdminMsgs = existingAdminMsgs.filter(
      (m) => !currentAdminMsgIds.has(m.id) && !currentAdminMsgTexts.has(m.text)
    );

    if (missingAdminMsgs.length > 0) {
      finalMessages = [...formattedMessages, ...missingAdminMsgs];
    }
  }

  const statusText = currentlyEscalated
    ? "Pengguna meminta terhubung dengan admin"
    : "";

  const sessionObj: ChatSession = {
    id: sessionId,
    visitorId: existingSession ? existingSession.visitorId : `#${randomNum}`,
    location: existingSession ? existingSession.location : randomCity,
    topic: inferredTopic,
    time: `Hari ini, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    satisfied: !currentlyEscalated,
    statusText: statusText,
    accuracy: 98,
    summary: currentlyEscalated
      ? "Pengguna meminta terhubung dengan admin"
      : `Pengunjung sedang berinteraksi dengan AI Chatbot (${finalMessages.length} pesan)`,
    isUnread: true,
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
  const sessions = getVisitorChatSessions();
  const updated = sessions.map((session) => {
    if (session.id === sessionId) {
      const adminMsg: ChatMessage = {
        id: `admin-reply-${Date.now()}`,
        sender: "admin",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...session,
        messages: [...session.messages, adminMsg],
      };
    }
    return session;
  });

  saveVisitorChatSessions(updated);
  window.dispatchEvent(new CustomEvent('bsmr_admin_replied_to_chat', { detail: { sessionId, replyText } }));

  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: 'ADMIN_REPLIED', sessionId, replyText });
    channel.close();
  }

  if (typeof window !== 'undefined') {
    window.postMessage({ type: 'BSMR_ADMIN_REPLIED', sessionId, replyText }, '*');
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
        messages: [...session.messages, userMsg],
      };
    }
    return session;
  });

  saveVisitorChatSessions(updated);
}

/**
 * Menghapus satu sesi obrolan pengunjung berdasarkan ID
 */
export function deleteVisitorChatSession(sessionId: string): ChatSession[] {
  const sessions = getVisitorChatSessions();
  const updated = sessions.filter((s) => s.id !== sessionId);
  saveVisitorChatSessions(updated);
  return updated;
}

/**
 * Menghapus banyak sesi obrolan pengunjung sekaligus (Bulk Delete)
 */
export function deleteBulkVisitorChatSessions(sessionIds: string[]): ChatSession[] {
  const sessions = getVisitorChatSessions();
  const setIds = new Set(sessionIds);
  const updated = sessions.filter((s) => !setIds.has(s.id));
  saveVisitorChatSessions(updated);
  return updated;
}

/**
 * Menghapus seluruh log chat pengunjung (Clear All)
 */
export function clearAllVisitorChatSessions(): ChatSession[] {
  saveVisitorChatSessions([]);
  return [];
}
