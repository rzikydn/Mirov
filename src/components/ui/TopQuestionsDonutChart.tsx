"use client";

import React, { useState, useEffect } from "react";
import { DonutChart } from "./donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { getTopQuestionsData, QuestionCategory } from "../../services/topQuestionsAnalytics";

interface TopQuestionsDonutChartProps {
  darkMode?: boolean;
  className?: string;
}

export default function TopQuestionsDonutChart({ darkMode, className }: TopQuestionsDonutChartProps) {
  const [categories, setCategories] = useState<QuestionCategory[]>(getTopQuestionsData);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(getTopQuestionsData());
    };

    window.addEventListener("bsmr_top_questions_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bsmr_top_questions_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Ambil Top 5 Kategori Teratas
  const top5 = categories.slice(0, 5);
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
          data={chartData}
          size={200}
          strokeWidth={24}
          animationDuration={1.2}
          animationDelayPerSegment={0.05}
          highlightOnHover={true}
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
                  {displayLabel}
                </p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {displayValue.toLocaleString('id-ID')}
                </p>
                {activeSegment && (
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
        {chartData.map((segment, index) => (
          <motion.div
            key={segment.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
