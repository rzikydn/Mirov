"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ThumbsUp, AlertCircle, RefreshCw, Send, Trash2, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  getVisitorChatSessions,
  fetchVisitorChatSessionsAsync,
  sendAdminReplyToSession,
  deleteBulkVisitorChatSessions,
  deleteVisitorChatSession,
  clearAllVisitorChatSessions,
  sortSessionsDescending,
  markSessionAsReadInService,
  ChatSession,
  ChatMessage
} from "../../services/visitorChatLogsService";

interface VisitorChatLogsWidgetProps {
  darkMode?: boolean;
  fullHeight?: boolean;
}

export default function VisitorChatLogsWidget({ darkMode, fullHeight = false }: VisitorChatLogsWidgetProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = getVisitorChatSessions();
    return Array.isArray(loaded) ? loaded : [];
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const loaded = getVisitorChatSessions();
    return loaded[0]?.id || "session-1";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");

  // State untuk Bulk Delete
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const userRole = (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u)?.role : "SUPERUSER";
    } catch (e) {
      return "SUPERUSER";
    }
  })();
  const canManage = userRole === "SUPERUSER" || userRole === "ADMIN" || !userRole;

  useEffect(() => {
    const handleUpdate = () => {
      const fresh = getVisitorChatSessions();
      if (Array.isArray(fresh)) {
        setSessions(fresh);
      }
    };

    const handleAsyncUpdate = async () => {
      handleUpdate();
      const freshApi = await fetchVisitorChatSessionsAsync();
      if (Array.isArray(freshApi)) {
        setSessions(freshApi);
      }
    };

    // Initial fetch on mount
    handleAsyncUpdate();

    // 1. Custom event listener
    window.addEventListener("bsmr_chat_logs_updated", handleUpdate);
    // 2. Storage event listener
    window.addEventListener("storage", handleUpdate);

    // 3. PostMessage listener for cross-window / iframe communication
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "BSMR_CHAT_LOGS_UPDATED") {
        if (Array.isArray(event.data.sessions)) {
          setSessions(event.data.sessions);
        } else {
          handleAsyncUpdate();
        }
      }
    };
    window.addEventListener("message", handleMessage);

    // 4. BroadcastChannel listener for same-origin multi-tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("bsmr_chat_sync_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "CHAT_LOGS_UPDATED") {
            if (Array.isArray(event.data.sessions)) {
              setSessions(event.data.sessions);
            } else {
              handleAsyncUpdate();
            }
          }
        };
      } catch (e) {
        // Fallback silently if not supported
      }
    }

    // 5. Polling fallback every 1.5 seconds for guaranteed live sync across any domain/IP
    const interval = setInterval(handleAsyncUpdate, 1500);

    return () => {
      window.removeEventListener("bsmr_chat_logs_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("message", handleMessage);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);

  const markSessionAsRead = React.useCallback((sessionId: string) => {
    if (typeof window === 'undefined' || !sessionId) return;
    const updated = markSessionAsReadInService(sessionId);
    if (Array.isArray(updated)) {
      setSessions(updated);
    }
  }, []);

  const safeSessions = sortSessionsDescending(Array.isArray(sessions) ? sessions : []);

  useEffect(() => {
    if (safeSessions.length > 0) {
      const exists = safeSessions.some((s) => s.id === selectedSessionId);
      if (!exists || !selectedSessionId) {
        setSelectedSessionId(safeSessions[0].id);
      }
    } else if (selectedSessionId !== "") {
      setSelectedSessionId("");
    }
  }, [safeSessions, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== "empty") {
      markSessionAsRead(selectedSessionId);
    }
  }, [selectedSessionId, markSessionAsRead]);

  const selectedSession = safeSessions.find((s) => s.id === selectedSessionId) || safeSessions[0] || {
    id: "empty",
    visitorId: "#0000",
    location: "Unknown",
    topic: "Belum Ada Sesi Chat",
    time: "-",
    dateStr: "-",
    satisfied: true,
    statusText: "-",
    accuracy: 100,
    summary: "",
    messages: []
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const fresh = getVisitorChatSessions();
    if (Array.isArray(fresh)) {
      setSessions(fresh);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || selectedSession.id === "empty") return;

    sendAdminReplyToSession(selectedSession.id, replyText.trim());
    setReplyText("");
  };

  const handleToggleSelectSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.length === safeSessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(safeSessions.map((s) => s.id));
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedSessionIds.length === 0) return;
    const count = selectedSessionIds.length;
    const updated = deleteBulkVisitorChatSessions(selectedSessionIds);
    setSessions(updated);
    if (updated.length > 0 && selectedSessionIds.includes(selectedSessionId)) {
      setSelectedSessionId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedSessionId("");
    }
    setSelectedSessionIds([]);
    setIsSelectMode(false);
    setShowDeleteModal(false);
    toast.success(`Berhasil menghapus ${count} sesi chat logs`);
  };

  const handleExecuteResetAll = () => {
    const updated = clearAllVisitorChatSessions();
    setSessions(updated);
    setSelectedSessionId("");
    setSelectedSessionIds([]);
    setIsSelectMode(false);
    setShowDeleteModal(false);
    toast.success("Log chat berhasil dibersihkan!");
  };

  const handleExecuteSingleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteVisitorChatSession(id);
    setSessions(updated);
    if (updated.length > 0 && id === selectedSessionId) {
      setSelectedSessionId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedSessionId("");
    }
    toast.success("Sesi chat berhasil dihapus");
  };

  return (
    <div className={cn(
      "w-full flex flex-col md:flex-row items-stretch gap-6 relative",
      fullHeight ? "h-[calc(100vh-140px)] min-h-[580px]" : "min-h-[460px]"
    )}>
      {/* Modal Konfirmasi Bulk Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={cn(
            "w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-xl transition-all",
            darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
          )}>
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/80">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold">Hapus Chat Logs Terpilih?</h3>
            </div>
            <p className={cn("text-xs leading-relaxed", darkMode ? "text-gray-300" : "text-gray-600")}>
              Apakah Anda yakin ingin menghapus <strong className="text-red-600">{selectedSessionIds.length} sesi chat logs</strong> terpilih? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Ya, Hapus ({selectedSessionIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left List Card: Sesi Chat BSMR.ORG Terbaru */}
      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[340px] shrink-0 rounded-xl border p-4 flex flex-col justify-between space-y-4 shadow-xs transition-colors",
          fullHeight ? "h-full" : "min-h-[460px]",
          darkMode ? "bg-gray-800/80 border-gray-700/60 text-white" : "bg-white border-gray-200/60 text-gray-900"
        )}
      >
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Header Sesi Chat Terbaru + Bulk Delete Action Button */}
          <div className="flex items-center justify-between gap-1 shrink-0 border-b pb-2 border-gray-100 dark:border-gray-800 min-w-0">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0", darkMode ? "text-gray-400" : "text-gray-500")}>
              {isSelectMode ? `SESI (${safeSessions.length})` : `SESI CHAT TERBARU (${safeSessions.length})`}
            </h3>

            {canManage && safeSessions.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                {isSelectMode ? (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-0.5 cursor-pointer whitespace-nowrap"
                    >
                      {selectedSessionIds.length === safeSessions.length ? "Batal" : "Pilih Semua"}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteResetAll}
                      className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline px-0.5 cursor-pointer whitespace-nowrap"
                      title="Hapus Seluruh Log Chat"
                    >
                      Hapus Semua
                    </button>
                    {selectedSessionIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                        title="Hapus Terpilih"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Hapus ({selectedSessionIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedSessionIds([]);
                      }}
                      className="text-[10px] font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 cursor-pointer whitespace-nowrap"
                    >
                      Selesai
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSelectMode(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-[10px] font-extrabold border border-red-200 dark:border-red-800/60 transition-colors cursor-pointer"
                    title="Hapus Sesi Chat Logs Terpilih"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    Bulk Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {safeSessions.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-gray-400 space-y-2 my-auto border border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                <Trash2 className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="font-bold text-gray-600 dark:text-gray-300">Belum Ada Sesi Chat Logs</p>
                <p className="text-[11px] text-gray-400">Seluruh riwayat obrolan telah dibersihkan.</p>
              </div>
            ) : (
              safeSessions.map((session) => {
                const isActive = session.id === selectedSessionId;
                const isChecked = selectedSessionIds.includes(session.id);
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (isSelectMode) {
                        handleToggleSelectSession(session.id);
                      } else {
                        setSelectedSessionId(session.id);
                        markSessionAsRead(session.id);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer relative group",
                      isActive
                        ? darkMode
                          ? "bg-gray-700/60 border-gray-500 text-white shadow-xs"
                          : "bg-white border-gray-400 text-gray-900 ring-1 ring-gray-200 shadow-2xs"
                        : darkMode
                        ? "bg-gray-900/40 border-gray-800/60 text-gray-300 hover:border-gray-700"
                        : "bg-gray-50/50 border-gray-200/50 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isSelectMode ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectSession(session.id, e as any)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer shrink-0 mr-1"
                          />
                        ) : (
                          session.isUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" title="Chat Baru" />
                          )
                        )}
                        <span className={cn("text-xs font-bold truncate", darkMode ? "text-gray-100" : "text-gray-900")}>
                          Pengunjung {session.visitorId}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn("text-[10px]", darkMode ? "text-gray-400" : "text-gray-400")}>
                          {session.time}
                        </span>
                        {canManage && !isSelectMode && (
                          <button
                            type="button"
                            onClick={(e) => handleExecuteSingleDelete(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-950/80 text-gray-400 hover:text-red-600 rounded transition-all cursor-pointer"
                            title="Hapus Sesi Ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {session.topic}
                    </p>

                    {(!session.satisfied || session.statusText.includes("terhubung dengan admin")) && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-700/60">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" /> Pengguna meminta terhubung dengan admin
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Detail Card: Inspeksi Percakapan Real-Time */}
      <div
        className={cn(
          "flex-1 min-w-0 rounded-xl border p-5 lg:p-6 flex flex-col justify-between space-y-4 shadow-xs transition-colors",
          fullHeight ? "h-full" : "min-h-[460px]",
          darkMode ? "bg-gray-800/80 border-gray-700/60 text-white" : "bg-white border-gray-200/60 text-gray-900"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4 border-gray-200/80 dark:border-gray-700/80 shrink-0">
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Inspeksi Percakapan Real-Time
            </h3>
            <p className={cn("text-xs mt-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>
              Pengunjung {selectedSession.visitorId} • Sesi {selectedSession.dateStr}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0",
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
              Reload logs
            </button>
          </div>
        </div>

        {/* Escalation Alert Banner */}
        {(!selectedSession.satisfied || selectedSession.statusText.includes("terhubung dengan admin")) && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-between gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-2xs shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Pengguna meminta terhubung dengan admin</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-[10px] uppercase font-extrabold tracking-wide text-amber-900 dark:text-amber-100 shrink-0">
              Perlu Balasan CS
            </span>
          </div>
        )}

        {/* Chat Messages flow */}
        <div className={cn(
          "flex-1 space-y-3.5 py-2 overflow-y-auto pr-2 flex flex-col justify-start min-h-0",
          fullHeight ? "min-h-[240px]" : "h-[240px] min-h-[240px]"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSession.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 w-full"
            >
              {selectedSession.messages && selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col space-y-1 max-w-[85%]",
                    msg.sender === "admin"
                      ? "ml-auto items-end"
                      : msg.sender === "bot"
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                      msg.sender === "admin"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : msg.sender === "bot"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : darkMode
                        ? "bg-gray-700 text-gray-100 border border-gray-600 rounded-bl-none"
                        : "bg-gray-100 text-gray-800 border border-gray-200/80 rounded-bl-none"
                    )}
                  >
                    {msg.sender === "admin" && (
                      <span className="block text-[10px] font-bold text-indigo-200 mb-0.5">Balasan Admin</span>
                    )}
                    {msg.text}
                  </div>
                  <span className={cn("text-[10px] px-1", darkMode ? "text-gray-400" : "text-gray-400")}>
                    {msg.time}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Admin Reply Message Input */}
        <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-3 border-t border-gray-200/80 dark:border-gray-700/80 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ketik balasan pesan ke pengunjung..."
              className={cn(
                "w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                darkMode
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  : "bg-gray-50 border-gray-200/60 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={!replyText.trim()}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
              "bg-blue-600 hover:bg-blue-700 active:scale-98"
            )}
          >
            <Send className="w-3.5 h-3.5" /> Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
