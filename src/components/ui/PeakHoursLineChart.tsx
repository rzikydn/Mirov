"use client";

import React, { useState, useEffect } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "./line-charts-1";
import { cn } from "../../lib/utils";
import { Clock } from "lucide-react";
import { getPeakHoursData, PeakHourBucket, INITIAL_PEAK_HOURS } from "../../services/peakHoursAnalytics";

interface PeakHoursLineChartProps {
  darkMode?: boolean;
}

const chartConfig = {
  chat: {
    label: "Interaksi Chat",
    color: "#14b8a6",
  },
  capacity: {
    label: "Kapasitas RAG AI",
    color: "#ec4899",
  },
};

const ChartLabel = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className="w-2.5 h-2.5 rounded-xs"
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    </div>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
  darkMode?: boolean;
}

const CustomTooltip = ({ active, payload, label, darkMode }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const chatValue = payload.find((p) => p.dataKey === "chat")?.value || 0;

    return (
      <div className={cn(
        "rounded-xl border p-3 shadow-lg min-w-[180px] space-y-2 text-xs",
        darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
      )}>
        <div className="font-bold flex items-center justify-between gap-2 border-b pb-1.5 border-gray-200 dark:border-gray-700">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-500" /> Jam {label} WIB
          </span>
          {chatValue > 180 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded">
              Puncak
            </span>
          )}
        </div>
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-3">
            <ChartLabel label="Interaksi Chat:" color={chartConfig.chat.color} />
            <span className="font-extrabold font-mono text-xs">
              {chatValue} chat
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <ChartLabel label="Kapasitas RAG AI:" color={chartConfig.capacity.color} />
            <span className="font-extrabold font-mono text-xs">
              150 chat
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PeakHoursLineChart({ darkMode }: PeakHoursLineChartProps) {
  const [data, setData] = useState<PeakHourBucket[]>(() => {
    const initial = getPeakHoursData();
    return Array.isArray(initial) && initial.length > 0 ? initial : INITIAL_PEAK_HOURS;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const fresh = getPeakHoursData();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setData(fresh);
      }
    };

    window.addEventListener("bsmr_peak_hours_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bsmr_peak_hours_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const totalChatCount = Array.isArray(data) ? data.reduce((acc, item) => acc + (item.chat || 0), 0) : 0;
  const safeData = Array.isArray(data) && data.length > 0 && totalChatCount > 0 ? data : INITIAL_PEAK_HOURS;

  return (
    <div
      className={cn(
        "p-5 lg:p-6 w-full rounded-xl border flex flex-col justify-between space-y-4 transition-colors shadow-xs",
        darkMode ? "bg-gray-800/80 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
      )}
    >
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight uppercase">
              Jam-Jam Sibuk Pengunjung (Peak Hours)
            </h3>
          </div>
          <p className={`text-[11px] mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aktivitas pertanyaan pengunjung website bsmr.org selama 24 jam terakhir (24 Jam Full)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ChartLabel label="Interaksi Chat" color={chartConfig.chat.color} />
          <ChartLabel label="Kapasitas RAG AI" color={chartConfig.capacity.color} />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full pt-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ComposedChart
            data={safeData}
            barCategoryGap="12%"
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={darkMode ? "#374151" : "#e5e7eb"}
              horizontal={true}
              vertical={false}
            />

            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              interval={1}
              tick={{ fontSize: 10, fill: darkMode ? "#9ca3af" : "#6b7280" }}
              dy={6}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={28}
              tick={({ y, payload }) => (
                <text
                  x={0}
                  y={y}
                  dy={4}
                  fill={darkMode ? "#9ca3af" : "#6b7280"}
                  fontSize={11}
                  textAnchor="start"
                >
                  {payload.value}
                </text>
              )}
              domain={[0, 'auto']}
            />

            <ChartTooltip
              content={<CustomTooltip darkMode={darkMode} />}
              cursor={{
                fill: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              }}
            />

            {/* Dense Interaksi Chat Bars */}
            <Bar
              dataKey="chat"
              fill={chartConfig.chat.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />

            {/* Kapasitas RAG AI Threshold Line */}
            <Line
              type="monotone"
              dataKey="capacity"
              stroke={chartConfig.capacity.color}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
}
