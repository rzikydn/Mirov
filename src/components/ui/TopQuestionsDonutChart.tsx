"use client";

import React, { useState, useEffect } from "react";
import { DonutChart } from "./donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { getTopQuestionsData, fetchTopQuestionsAsync, QuestionCategory } from "../../services/topQuestionsAnalytics";

interface TopQuestionsDonutChartProps {
  darkMode?: boolean;
  className?: string;
}

export default function TopQuestionsDonutChart({ darkMode, className }: TopQuestionsDonutChartProps) {
  const [categories, setCategories] = useState<QuestionCategory[]>(getTopQuestionsData);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const fresh = getTopQuestionsData();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setCategories((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
          return fresh;
        });
      }
    };

    const handleAsyncUpdate = async () => {
      handleUpdate();
      try {
        const freshApi = await fetchTopQuestionsAsync();
        if (Array.isArray(freshApi) && freshApi.length > 0) {
          setCategories((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(freshApi)) return prev;
            return freshApi;
          });
        }
      } catch (e) {}
    };

    handleAsyncUpdate();

    // Listen to local events for immediate 0ms update
    window.addEventListener("bsmr_top_questions_updated", handleUpdate);
    window.addEventListener("bsmr_chat_logs_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Listen to iframe / parent postMessages
    const handleMessage = (e: MessageEvent) => {
      if (
        (e.data?.type === "BSMR_TOP_QUESTIONS_UPDATED" || e.data?.type === "TOP_QUESTIONS_UPDATED") &&
        Array.isArray(e.data.categories)
      ) {
        setCategories((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(e.data.categories)) return prev;
          return e.data.categories;
        });
      } else if (
        e.data?.type === "BSMR_CHAT_LOGS_UPDATED" ||
        e.data?.type === "CHAT_LOGS_UPDATED" ||
        e.data?.type === "BSMR_ADMIN_REPLIED" ||
        e.data?.type === "BSMR_TOP_QUESTIONS_UPDATED"
      ) {
        handleUpdate();
      }
    };
    window.addEventListener("message", handleMessage);

    // Listen to BroadcastChannels across tabs
    let chatChannel: BroadcastChannel | null = null;
    let topQChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        chatChannel = new BroadcastChannel("bsmr_chat_sync_channel");
        chatChannel.onmessage = (event) => {
          if (event.data?.type === "TOP_QUESTIONS_UPDATED" && Array.isArray(event.data.categories)) {
            setCategories((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(event.data.categories)) return prev;
              return event.data.categories;
            });
          } else if (event.data?.type === "CHAT_LOGS_UPDATED" || event.data?.type === "ADMIN_REPLIED") {
            handleUpdate();
          }
        };

        topQChannel = new BroadcastChannel("bsmr_top_questions_sync");
        topQChannel.onmessage = (event) => {
          if (event.data?.type === "TOP_QUESTIONS_UPDATED" && Array.isArray(event.data.categories)) {
            setCategories((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(event.data.categories)) return prev;
              return event.data.categories;
            });
          } else {
            handleUpdate();
          }
        };
      } catch (e) {}
    }

    // Fast polling fallback for instant synchronization
    const interval = setInterval(handleUpdate, 1000);

    return () => {
      window.removeEventListener("bsmr_top_questions_updated", handleUpdate);
      window.removeEventListener("bsmr_chat_logs_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("message", handleMessage);
      if (chatChannel) chatChannel.close();
      if (topQChannel) topQChannel.close();
      clearInterval(interval);
    };
  }, []);

  // Filter HANYA kategori yang memiliki minimal 1 pertanyaan (count > 0) & urutkan terbanyak (Descending)
  const activeCategories = categories
    .filter((cat) => (cat.count || 0) > 0)
    .sort((a, b) => b.count - a.count);
  const top5 = activeCategories.slice(0, 5);

  const chartData = top5.map((cat) => ({
    value: cat.count,
    color: cat.color,
    label: cat.label,
  }));

  const totalQueryValue = chartData.reduce((sum, d) => sum + d.value, 0);

  const activeSegment = chartData.find(
    (segment) => segment.label === hoveredSegment
  );

  const displayValue = activeSegment?.value ?? totalQueryValue;
  const displayLabel = activeSegment?.label ?? "Total Pertanyaan";
  const displayPercentage = activeSegment
    ? totalQueryValue > 0
      ? (activeSegment.value / totalQueryValue) * 100
      : 0
    : 100;

  // Placeholder data untuk DonutChart saat belum ada pertanyaan sama sekali
  const placeholderChartData = [
    { value: 1, color: darkMode ? "#374151" : "#e5e7eb", label: "Belum Ada Data" }
  ];

  return (
    <div
      className={cn(
        "p-5 lg:p-6 w-full rounded-xl border flex flex-col items-center justify-between space-y-4 transition-colors shadow-xs",
        darkMode ? "bg-gray-800/80 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900",
        className
      )}
    >
      <h3 className="text-sm font-bold text-center tracking-tight uppercase">
        Top 5 Pertanyaan Populer
      </h3>

      <div className="relative flex items-center justify-center py-1">
        <DonutChart
          data={chartData.length > 0 ? chartData : placeholderChartData}
          size={200}
          strokeWidth={24}
          animationDuration={1.2}
          animationDelayPerSegment={0.05}
          highlightOnHover={chartData.length > 0}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="flex flex-col items-center justify-center text-center p-1"
              >
                <p className={`text-[11px] font-medium truncate max-w-[120px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {chartData.length > 0 ? displayLabel : "Total Pertanyaan"}
                </p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {chartData.length > 0 ? displayValue.toLocaleString('id-ID') : "0"}
                </p>
                {activeSegment && chartData.length > 0 && (
                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    [{displayPercentage.toFixed(0)}%]
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      <div className={`flex flex-col space-y-1.5 w-full pt-3 border-t text-xs ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {chartData.length > 0 ? (
          chartData.map((segment) => (
            <div
              key={segment.label}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-md transition-all duration-150 cursor-pointer",
                hoveredSegment === segment.label
                  ? darkMode
                    ? "bg-gray-700/60"
                    : "bg-gray-100"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
              )}
              onMouseEnter={() => setHoveredSegment(segment.label)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-[11px] font-medium truncate">
                  {segment.label}
                </span>
              </div>
              <span className={`text-[11px] font-bold shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {segment.value.toLocaleString('id-ID')}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-3 text-gray-400 dark:text-gray-500 text-[11px]">
            Belum ada data pertanyaan dari pengunjung
          </div>
        )}
      </div>
    </div>
  );
}
