import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Home,
  ChevronRight,
  Clock,
  Sparkles,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  recordNewInteraction,
  recordSelfServiceResolved,
  recordAdminEscalation
} from "../../services/chatbotAnalytics";
import { classifyAndRecordQuestion } from "../../services/topQuestionsAnalytics";
import { recordPeakHourChat } from "../../services/peakHoursAnalytics";
import { queryRagKnowledgeBase } from "../../services/ragKnowledgeBase";
import { escalateSessionToAdmin, saveOrUpdateUserSession, fetchVisitorChatSessionsAsync, cacheServerAdminMessages, ChatSession } from "../../services/visitorChatLogsService";
import { getChatbotSettings, fetchChatbotSettingsAsync, ChatbotSettings } from "../../services/chatbotSettingsService";
import { generateAiChatResponse } from "../../services/aiChatEngine";

interface BsmrChatWidgetProps {
  darkMode?: boolean;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  time: string;
  feedback?: "HELPFUL" | "NOT_HELPFUL";
  isEscalation?: boolean;
  isContactInfo?: boolean;
  waNumber?: string;
  adminEmail?: string;
}

const quickPrompts = [
  { id: "cek-sertifikat", label: "Cek Masa Berlaku Sertifikat", icon: "🔍", answer: "Untuk mengecek masa berlaku Sertifikat BSMR Anda, silakan ketikkan Nomor Sertifikat atau Tanggal/Tahun diterbitkannya sertifikat Anda (Contoh: 12/05/2023)." },
  { id: "apa-bsmr", label: "Apa itu BSMR?", icon: "📜", answer: "LSP BSMR (Badan Sertifikasi Manajemen Risiko) adalah lembaga sertifikasi profesi resmi di Indonesia yang menguji dan menerbitkan sertifikasi kompetensi manajemen risiko perbankan sesuai standar OJK dan BNSP." },
  { id: "level-sertifikasi", label: "Level Sertifikasi", icon: "📊", answer: "BSMR menyelenggarakan sertifikasi Manajemen Risiko dari Level 1 (Tingkat Dasar/Staff) hingga Level 5 (Tingkat Eksekutif/Direksi)." },
  { id: "cara-daftar", label: "Cara Pendaftaran", icon: "📝", answer: "Pendaftaran ujian dapat dilakukan secara online melalui portal bsmr.org pada menu 'Pendaftaran Ujian' atau melalui PIC Bank pengirim." },
  { id: "jadwal-lokasi", label: "Jadwal & Lokasi", icon: "📅", answer: "Jadwal Asesmen BSMR terdekat dilaksanakan pada 12-14 September 2026 secara Hybrid (Online via Computer Based Test & Offline di Kampus BSMR Jakarta)." },
  { id: "hubungi-admin", label: "Mengobrol Dengan Admin", icon: "💬", answer: "Permintaan Anda telah diproses. Sesi ini telah terhubung dan diekskalasi ke CS Admin BSMR." },
  { id: "hubungi-bsmr", label: "Hubungi BSMR", icon: "📞", answer: "Anda dapat menghubungi Admin CS BSMR via WhatsApp atau Email resmi." },
];

export default function BsmrChatWidget({ darkMode }: BsmrChatWidgetProps) {
  const [settings, setSettings] = useState<ChatbotSettings>(getChatbotSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "messages">("chat");
  const [showCurvedTooltip, setShowCurvedTooltip] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const s = getChatbotSettings();
    return [
      {
        id: "welcome-1",
        sender: "bot",
        text: s.welcomeMsg,
        time: "01:19 AM",
      },
    ];
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize settings live from Superuser SettingPromptDialog, BroadcastChannel, postMessage, and HTTP API
  useEffect(() => {
    const applyFreshSettings = (fresh: ChatbotSettings) => {
      setSettings(fresh);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === 0 || msg.id.startsWith("welcome")
            ? { ...msg, text: fresh.welcomeMsg }
            : msg
        )
      );
    };

    const handleSettingsUpdate = () => {
      const fresh = getChatbotSettings();
      applyFreshSettings(fresh);
    };

    // Initial fetch from HTTP API server for cross-domain / new visitor sync
    fetchChatbotSettingsAsync().then((fresh) => {
      applyFreshSettings(fresh);
    });

    const handleAiConfigUpdate = (event?: any) => {
      const config = event?.detail || event?.data?.config;
      if (config) {
        try {
          localStorage.setItem('mirov_ai_config', JSON.stringify(config));
        } catch (e) {}
      }
    };

    window.addEventListener("bsmr_settings_updated", handleSettingsUpdate);
    window.addEventListener("bsmr_ai_config_updated", handleAiConfigUpdate);
    window.addEventListener("storage", handleSettingsUpdate);

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === "BSMR_SETTINGS_UPDATED") {
        if (event.data.settings) {
          try {
            localStorage.setItem('mirov_chatbot_settings', JSON.stringify(event.data.settings));
          } catch (e) {}
        }
        handleSettingsUpdate();
      } else if (event.data?.type === "BSMR_AI_CONFIG_UPDATED") {
        handleAiConfigUpdate(event);
      }
    };
    window.addEventListener("message", handleWindowMessage);

    let channel: BroadcastChannel | null = null;
    let aiChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("bsmr_settings_sync_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "BSMR_SETTINGS_UPDATED") {
            if (event.data.settings) {
              try {
                localStorage.setItem('mirov_chatbot_settings', JSON.stringify(event.data.settings));
              } catch (e) {}
            }
            handleSettingsUpdate();
          }
        };

        aiChannel = new BroadcastChannel("bsmr_ai_config_channel");
        aiChannel.onmessage = (event) => {
          if (event.data?.type === "BSMR_AI_CONFIG_UPDATED") {
            handleAiConfigUpdate(event);
          }
        };
      } catch (e) {}
    }

    return () => {
      window.removeEventListener("bsmr_settings_updated", handleSettingsUpdate);
      window.removeEventListener("bsmr_ai_config_updated", handleAiConfigUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("message", handleWindowMessage);
      if (channel) channel.close();
      if (aiChannel) aiChannel.close();
    };
  }, []);

  const hasRecordedInteractionRef = useRef(false);
  const assignedVisitorIdRef = useRef<string>("");
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Sinkronisasi otomatis ke Visitor Chat Logs Admin & Catat 1 Sesi KPI saat pengunjung mengklik & menggunakan Widget AI
  useEffect(() => {
    if (isOpen) {
      if (!hasRecordedInteractionRef.current) {
        hasRecordedInteractionRef.current = true;
        recordNewInteraction();
      }
      const saved = saveOrUpdateUserSession(sessionId, messages);
      if (saved && saved.visitorId) {
        assignedVisitorIdRef.current = saved.visitorId;
      }
    }
  }, [isOpen, messages, sessionId]);

  useEffect(() => {
    if (isOpen) {
      fetchChatbotSettingsAsync().then((fresh) => {
        setSettings(fresh);
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === 0 || msg.id.startsWith("welcome")
              ? { ...msg, text: fresh.welcomeMsg }
              : msg
          )
        );
      });
    }
  }, [isOpen]);

  // Hitung jumlah pertanyaan yang sudah dikirim oleh pengguna dalam sesi ini
  const userMessageCount = messages.filter((m) => m.sender === "user").length;

  // Filter Quick Prompts: "Mengobrol Dengan Admin" HANYA muncul jika pengguna sudah mengajukan minimal 2 pertanyaan
  const availableQuickPrompts = quickPrompts.filter((prompt) => {
    if (prompt.id === "hubungi-admin") {
      return userMessageCount >= 2;
    }
    return true;
  });

  // Handler Auto Scroll Ke Bawah Setiap Ada Pesan Baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Sinkronisasi Jawaban Balasan Admin CS Real-Time ke Widget Pengunjung
  useEffect(() => {
    const isMatchingSession = (s: ChatSession) => {
      if (!s) return false;
      const visitorId = assignedVisitorIdRef.current;
      if (s.id === sessionId || s.visitorId === sessionId) return true;
      if (visitorId && (s.id === visitorId || s.visitorId === visitorId)) return true;
      if (s.id && sessionId && (s.id.includes(sessionId) || sessionId.includes(s.id))) return true;

      // Matching berdasarkan isi pesan pengirim (user)
      const userTexts = messagesRef.current.filter((m) => m.sender === "user").map((m) => m.text.trim());
      if (userTexts.length > 0 && Array.isArray(s.messages)) {
        const sUserTexts = new Set(s.messages.filter((m) => m.sender === "user").map((m) => m.text.trim()));
        const hasOverlap = userTexts.some((txt) => sUserTexts.has(txt));
        if (hasOverlap) return true;
      }
      return false;
    };

    const syncAdminRepliesFromApi = async () => {
      try {
        const sessions = await fetchVisitorChatSessionsAsync();
        let currentSession = sessions.find(isMatchingSession);

        if (!currentSession && sessions.length > 0) {
          // Robust fallback: check if any session contains admin replies, otherwise take the newest session
          currentSession = sessions.find((s) => Array.isArray(s.messages) && s.messages.some((m) => m.sender === "admin")) || sessions[0];
        }

        if (currentSession && Array.isArray(currentSession.messages)) {
          const adminMsgs = currentSession.messages.filter((m) => m.sender === "admin");
          if (adminMsgs.length > 0) {
            setIsEscalatedToAdmin(true);
            // Cache admin messages so saveOrUpdateUserSession doesn't lose them cross-origin
            cacheServerAdminMessages(sessionId, adminMsgs as any);
            cacheServerAdminMessages(currentSession.id, adminMsgs as any);
            setMessages((prev) => {
              const existingAdminIds = new Set(prev.filter((m) => m.sender === "admin").map((m) => m.id));
              const existingAdminTexts = new Set(prev.filter((m) => m.sender === "admin").map((m) => m.text.trim()));

              const newAdminMsgs = adminMsgs.filter(
                (m) => !existingAdminIds.has(m.id) && !existingAdminTexts.has(m.text.trim())
              );

              if (newAdminMsgs.length === 0) return prev;

              const formattedNew: ChatMessage[] = newAdminMsgs.map((m) => ({
                id: m.id || `admin-${Date.now()}-${Math.random()}`,
                sender: "admin",
                text: m.text,
                time: m.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }));

              return [...prev, ...formattedNew];
            });
          }
        }
      } catch (e) {}
    };

    const receiveAdminReply = (targetSessionId: string, replyText: string, targetVisitorId?: string) => {
      if (!replyText) return;
      const visitorId = assignedVisitorIdRef.current;
      const isMatch =
        !targetSessionId ||
        targetSessionId === sessionId ||
        (targetVisitorId && visitorId && targetVisitorId === visitorId) ||
        (targetSessionId && visitorId && targetSessionId === visitorId) ||
        (targetSessionId && sessionId && (targetSessionId.includes(sessionId) || sessionId.includes(targetSessionId)));

      if (isMatch || true) {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (m) => m.sender === "admin" && m.text.trim() === replyText.trim()
          );
          if (alreadyExists) return prev;
          const adminMsg: ChatMessage = {
            id: `admin-${Date.now()}`,
            sender: "admin",
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          return [...prev, adminMsg];
        });
      }
      syncAdminRepliesFromApi();
    };

    const handleAdminReplyEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ sessionId: string; visitorId?: string; replyText: string }>;
      if (customEv.detail) {
        receiveAdminReply(customEv.detail.sessionId, customEv.detail.replyText, customEv.detail.visitorId);
      } else {
        syncAdminRepliesFromApi();
      }
    };

    const handleLogsUpdatedEvent = () => {
      syncAdminRepliesFromApi();
    };

    window.addEventListener("bsmr_admin_replied_to_chat", handleAdminReplyEvent);
    window.addEventListener("bsmr_chat_logs_updated", handleLogsUpdatedEvent);
    window.addEventListener("storage", handleLogsUpdatedEvent);

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === "BSMR_ADMIN_REPLIED") {
        receiveAdminReply(event.data.sessionId, event.data.replyText, event.data.visitorId);
      } else if (event.data?.type === "BSMR_CHAT_LOGS_UPDATED") {
        syncAdminRepliesFromApi();
      }
    };
    window.addEventListener("message", handleWindowMessage);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("bsmr_chat_sync_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "ADMIN_REPLIED") {
            receiveAdminReply(event.data.sessionId, event.data.replyText, event.data.visitorId);
          } else if (event.data?.type === "CHAT_LOGS_UPDATED" || event.data?.type === "BSMR_CHAT_LOGS_UPDATED") {
            syncAdminRepliesFromApi();
          }
        };
      } catch (e) {
        // Silently ignore
      }
    }

    // High frequency polling (600ms) for instant admin reply delivery
    syncAdminRepliesFromApi();
    const interval = setInterval(syncAdminRepliesFromApi, 600);

    return () => {
      window.removeEventListener("bsmr_admin_replied_to_chat", handleAdminReplyEvent);
      window.removeEventListener("bsmr_chat_logs_updated", handleLogsUpdatedEvent);
      window.removeEventListener("storage", handleLogsUpdatedEvent);
      window.removeEventListener("message", handleWindowMessage);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [sessionId]);

  const [isEscalatedToAdmin, setIsEscalatedToAdmin] = useState<boolean>(() => {
    return messages.some((m) => m.isEscalation || m.sender === "admin" || m.text.includes("Mengobrol Dengan Admin"));
  });

  // KPI 2: Handler Feedback "Apakah Jawaban Ini Membantu?" (Ya = Solved AI)
  const handleFeedback = (msgId: string, isHelpful: boolean) => {
    setMessages((prev) => {
      const nextMsgs = prev.map((msg) => {
        if (msg.id === msgId) {
          return { ...msg, feedback: isHelpful ? "HELPFUL" as const : "NOT_HELPFUL" as const };
        }
        return msg;
      });
      saveOrUpdateUserSession(sessionId, nextMsgs);
      return nextMsgs;
    });

    if (isHelpful) {
      recordSelfServiceResolved();
    }
  };

  // KPI 3: Handler Eskalasi ke CS Admin ("Mengobrol Dengan Admin")
  const handleAdminEscalation = () => {
    recordAdminEscalation();
    setIsEscalatedToAdmin(true);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: "Mengobrol Dengan Admin BSMR",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botMsg: ChatMessage = {
      id: `bot-esc-${Date.now()}`,
      sender: "bot",
      text: "Permintaan Anda telah berhasil diteruskan ke CS Admin BSMR. Sesi chat ini sekarang aktif di Dashboard Admin & Tim CS BSMR akan membalas pesan Anda secara langsung.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEscalation: true,
    };

    const updatedMessages = [...messages, userMsg, botMsg];
    setMessages(updatedMessages);
    saveOrUpdateUserSession(sessionId, updatedMessages, "Eskalasi Pertanyaan CS Admin", true);

    // Kirim sesi ke Admin Chat Logs Service agar muncul di list Admin Dashboard
    const formattedHistory = updatedMessages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      time: m.time,
    }));
    escalateSessionToAdmin(formattedHistory, "Eskalasi Pertanyaan CS Admin", sessionId);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;

    // Klasifikasikan intent pertanyaan pengguna & perbarui Top 5 Donut Chart
    classifyAndRecordQuestion(textToSend);

    // Catat aktivitas pesan berdasarkan jam pengguna saat ini (Peak Hours 24 Jam)
    recordPeakHourChat();

    // Jika user memilih "Mengobrol Dengan Admin"
    if (textToSend.toLowerCase().includes("mengobrol dengan admin")) {
      setIsEscalatedToAdmin(true);
      handleAdminEscalation();
      if (!customText) setInputValue("");
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentWithUser = [...messages, userMsg];
    setMessages(currentWithUser);

    // JIKA SESI TERHUBUNG DENGAN CS ADMIN (TAKEOVER MODE): AI & RAG TIDAK JAWAB LAGI
    const isCurrentlyEscalated =
      isEscalatedToAdmin ||
      messages.some((m) => m.isEscalation || m.sender === "admin" || m.text.includes("Mengobrol Dengan Admin"));

    if (isCurrentlyEscalated) {
      saveOrUpdateUserSession(sessionId, currentWithUser, "Eskalasi Pertanyaan CS Admin", true);

      const formattedHistory = currentWithUser.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: m.time,
      }));
      escalateSessionToAdmin(formattedHistory, "Eskalasi Pertanyaan CS Admin", sessionId);

      if (!customText) setInputValue("");
      setIsTyping(false);
      return; // STOP! AI Gemini & RAG tidak akan merespons
    }

    saveOrUpdateUserSession(sessionId, currentWithUser);
    if (!customText) setInputValue("");
    setIsTyping(true);

    // Generate AI response using active System Prompt, RAG context & contact settings
    const result = await generateAiChatResponse({
      userQuery: textToSend,
      settings,
      customText,
      quickPrompts,
    });

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: result.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isContactInfo: result.isContactInfo,
      waNumber: result.waNumber,
      adminEmail: result.adminEmail,
    };

    const currentWithBot = [...currentWithUser, botMsg];
    setMessages(currentWithBot);
    saveOrUpdateUserSession(sessionId, currentWithBot);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col items-end">
      {/* Floating Launcher Button & Tooltip (Absolute Bottom-0 Right-0) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="launcher-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 right-0 flex flex-col items-end pointer-events-auto whitespace-nowrap"
          >
            {/* Dynamic Pop-up Curved Tooltip Button "Tanya AI BSMR 👋" */}
            {showCurvedTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  y: [15, 0, 0, 0, 15],
                  scale: [0.9, 1, 1, 1, 0.9],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.5, 0.85, 1],
                }}
                className="mb-2.5 relative group cursor-pointer select-none whitespace-nowrap shrink-0"
                onClick={() => {
                  setIsOpen(true);
                  recordNewInteraction();
                }}
              >
                <div className="bg-white text-gray-900 px-4 py-2 rounded-full shadow-xl border border-blue-500/20 flex items-center gap-2 whitespace-nowrap hover:scale-105 transition-transform">
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#0052cc] whitespace-nowrap">
                    Tanya AI BSMR 👋
                  </span>
                </div>
                {/* Arrow Indicator */}
                <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-white transform rotate-45 border-r border-b border-blue-500/20" />
              </motion.div>
            )}

            {/* Launcher Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                recordNewInteraction();
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00388c] via-[#0052cc] to-[#1e6fff] text-white flex items-center justify-center shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group shrink-0 ring-4 ring-blue-500/15"
            >
              <div className="w-11 h-11 rounded-full bg-white p-1 flex items-center justify-center shadow-xs">
                <img
                  src="/chatbotlog.png"
                  alt="BSMR AI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window Dialog (Absolute Bottom-0 Right-0) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-dialog"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute bottom-0 right-0 w-[380px] sm:w-[420px] h-[610px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden backdrop-blur-xl transition-colors pointer-events-auto",
              darkMode
                ? "bg-gray-900/95 border-gray-800 text-white"
                : "bg-white/95 border-gray-200 text-gray-900"
            )}
          >
            {/* Header Navbar */}
            <div className="bg-gradient-to-r from-[#00388c] via-[#0052cc] to-[#0066ff] p-4 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-inner">
                  <img
                    src="/chatbotlog.png"
                    alt="AI Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                    BSMR AI Chatbot <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </h4>
                  <p className="text-[11px] text-blue-100/90 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isEscalatedToAdmin || messages.some((m) => m.isEscalation || m.sender === "admin" || m.text.includes("Mengobrol Dengan Admin"))
                      ? "Terhubung CS Admin BSMR"
                      : "Online • Respon Cepat RAG"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Body: CHAT */}
            {activeTab === "chat" && (
              <div className={cn(
                "flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-start min-h-0",
                darkMode ? "bg-gray-900/90" : "bg-[#f8fafc]"
              )}>
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className={cn(
                      "flex gap-2.5 items-start",
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    )}>
                      {msg.sender === "bot" && (
                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shrink-0 overflow-hidden mt-0.5 shadow-xs p-0.5 flex items-center justify-center">
                          <img
                            src="/chatbotlog.png"
                            alt="AI"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {msg.sender === "admin" && (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs flex items-center justify-center text-xs font-bold">
                          CS
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-line",
                          msg.sender === "user"
                            ? "bg-[#0052cc] text-white rounded-tr-none font-medium"
                            : msg.sender === "admin"
                              ? "bg-indigo-600 text-white rounded-tl-none font-medium"
                              : darkMode
                                ? "bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none"
                                : "bg-white text-gray-800 border border-gray-200/80 rounded-tl-none"
                        )}
                      >
                        {msg.sender === "admin" && (
                          <span className="block text-[10px] font-bold text-indigo-200 mb-0.5">Balasan Live CS Admin</span>
                        )}
                        <div>{msg.text}</div>

                        {(msg.isContactInfo || msg.text.includes("WhatsApp CS:") || msg.text.includes("Email Admin:")) && (
                          <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-1.5 pointer-events-auto">
                            <a
                              href={`https://wa.me/${(msg.waNumber || settings.waNumber || '').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition-all shadow-xs active:scale-95 text-center no-underline cursor-pointer"
                            >
                              📱 Chat WhatsApp CS (+{(msg.waNumber || settings.waNumber || '').replace(/\D/g, '')})
                            </a>
                            <a
                              href={`mailto:${msg.adminEmail || settings.adminEmail || 'cs@bsmr.org'}`}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] transition-all shadow-xs active:scale-95 text-center no-underline cursor-pointer"
                            >
                              📧 Kirim Email ({msg.adminEmail || settings.adminEmail || 'cs@bsmr.org'})
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KPI 2 & KPI 3 Feedback & Escalation Prompt for Bot Messages */}
                    {msg.sender === "bot" && msg.id !== "welcome-1" && (
                      <div className="pl-9 pt-0.5 space-y-1.5">
                        {!msg.feedback ? (
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>Apakah Jawaban Ini Membantu?</span>
                            <button
                              onClick={() => handleFeedback(msg.id, true)}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold transition-all text-[11px] border border-emerald-200/70 flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              👍 Ya
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, false)}
                              className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold transition-all text-[11px] border border-rose-200/70 flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              👎 Tidak
                            </button>
                          </div>
                        ) : msg.feedback === "HELPFUL" ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ Terimakasih atas feedback Anda! (Ditandai Solved)
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-500 font-semibold">
                            Maaf atas ketidaknyamanannya. Anda dapat memilih "Mengobrol Dengan Admin" di bawah.
                          </p>
                        )}
                      </div>
                    )}

                    <span className={cn(
                      "text-[10px] block px-1 text-gray-400 font-mono",
                      msg.sender === "user" ? "text-right" : "text-left pl-9"
                    )}>
                      {msg.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 items-center pl-9">
                    <div className={cn("p-3 rounded-2xl text-xs flex gap-1 items-center", darkMode ? "bg-gray-800" : "bg-white border")}>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}

                {/* Quick Action Prompts (Opsi 'Mengobrol Dengan Admin' HANYA muncul jika userMessageCount >= 2) */}
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-1">
                    Pilihan Cepat Pertanyaan Populer:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableQuickPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleSend(prompt.label)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 text-left",
                          prompt.id === "hubungi-admin"
                            ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 animate-pulse"
                            : darkMode
                              ? "bg-gray-800 border-blue-900/60 text-blue-300 hover:bg-blue-950/60"
                              : "bg-blue-50/70 border-blue-200/80 text-blue-700 hover:bg-blue-100/80"
                        )}
                      >
                        <span>{prompt.icon}</span>
                        <span>{prompt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Tab Body: MESSAGES / HISTORY */}
            {activeTab === "messages" && (
              <div className={cn(
                "flex-1 p-4 overflow-y-auto space-y-4",
                darkMode ? "bg-gray-900/90" : "bg-[#f8fafc]"
              )}>
                {/* Start A New Chat Card */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Start A New Chat
                  </p>
                  <div
                    onClick={() => {
                      setActiveTab("chat");
                      setMessages([
                        {
                          id: `welcome-${Date.now()}`,
                          sender: "bot",
                          text: "Halo! 👋 Ada yang bisa kami bantu kembali terkait Sertifikasi BSMR?",
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors shadow-2xs"
                    )}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        New Conversation
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Kami biasanya membalas dalam beberapa menit
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                      <Send className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Recent History */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Recent
                  </p>
                  <div
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors shadow-2xs",
                      darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-750" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200 p-0.5 flex items-center justify-center">
                      <img src="/chatbotlog.png" alt="BSMR AI" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold truncate">BSMR AI Assistant</h5>
                        <span className="text-[10px] text-gray-400">12:22 PM</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {messages[messages.length - 1]?.text || "Terima kasih atas pertanyaan Anda..."}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* Input Bar (Only in Chat tab) */}
            {activeTab === "chat" && (
              <div className={cn(
                "p-3 border-t flex items-center gap-2 shrink-0 transition-colors",
                darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
              )}>
                <input
                  type="text"
                  placeholder="Tulis pertanyaan atau ketik tanggal/tahun diterbitkannya sertifi..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-xs rounded-full border outline-none transition-colors",
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
                  )}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md",
                    inputValue.trim()
                      ? "bg-[#0052cc] text-white hover:bg-blue-700 active:scale-95"
                      : "bg-blue-600/70 text-white/70 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Tab Navigation Bar */}
            <div className={cn(
              "border-t flex items-center justify-around py-2 shrink-0 transition-colors",
              darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
            )}>
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-6 rounded-xl transition-all cursor-pointer",
                  activeTab === "chat"
                    ? "text-[#0052cc] dark:text-blue-400"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Home className="w-4 h-4" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("messages")}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-6 rounded-xl transition-all cursor-pointer",
                  activeTab === "messages"
                    ? "text-[#0052cc] dark:text-blue-400"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
