"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart2, AlertCircle, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { HistoryEntry } from "../../context/HistoryContext";

interface ActivityGraphProps {
  history: HistoryEntry[];
  darkMode: boolean;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

// ── Indonesian Date Helpers ──
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, darkMode }: any) => {
  if (active && payload && payload.length) {
    const items = payload.filter((entry: any) => !entry.dataKey.endsWith('Area'));

    return (
      <div
        className={`rounded-xl border p-2.5 shadow-xl text-xs space-y-1.5 min-w-[170px] backdrop-blur-md ${
          darkMode
            ? 'bg-[#18181b]/95 border-gray-700 text-white'
            : 'bg-gray-900/95 border-gray-800 text-white'
        }`}
      >
        <div className="font-semibold text-gray-300 border-b border-gray-700/60 pb-1 text-[11px] flex items-center justify-between">
          <span>{label}</span>
        </div>
        <div className="space-y-1 pt-0.5">
          {items.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-[11px]">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full border bg-transparent" style={{ borderColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ActivityGraph: React.FC<ActivityGraphProps> = ({
  history,
  darkMode,
  onDateSelect,
  selectedDate,
}) => {
  const [timeRange, setTimeRange] = useState<'14d' | '30d' | '90d'>('14d');

  // 1. Process daily history counts based on selected timeRange
  const daysCount = timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90;

  const chartData = useMemo(() => {
    const today = new Date();
    const result: Array<{
      dateStr: string; // YYYY-MM-DD
      month: string; // 22 Jul
      fullDate: string; // Senin, 22 Juli 2026
      created: number;
      edited: number;
      deleted: number;
      other: number;
      total: number;
      editedArea: number;
      createdArea: number;
    }> = [];

    const mapByDate = new Map<string, { created: number; edited: number; deleted: number; other: number }>();

    history.forEach((entry) => {
      const d = new Date(entry.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!mapByDate.has(key)) {
        mapByDate.set(key, { created: 0, edited: 0, deleted: 0, other: 0 });
      }
      const item = mapByDate.get(key)!;
      const action = (entry.action || '').toLowerCase();
      const desc = (entry.description || '').toLowerCase();

      if (action === 'create' || action === 'added' || desc.includes('created') || desc.includes('added')) {
        item.created++;
      } else if (action === 'edit' || action === 'update' || desc.includes('updated') || desc.includes('changed')) {
        item.edited++;
      } else if (action === 'delete' || action === 'remove' || desc.includes('deleted') || desc.includes('removed')) {
        item.deleted++;
      } else {
        item.other++;
      }
    });

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const counts = mapByDate.get(key) || { created: 0, edited: 0, deleted: 0, other: 0 };
      const total = counts.created + counts.edited + counts.deleted + counts.other;

      result.push({
        dateStr: key,
        month: `${d.getDate()} ${BULAN[d.getMonth()]}`,
        fullDate: `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`,
        created: counts.created,
        edited: counts.edited,
        deleted: counts.deleted,
        other: counts.other,
        total,
        editedArea: counts.edited,
        createdArea: counts.created,
      });
    }

    return result;
  }, [history, daysCount]);

  // 2. Summary stats for distribution progress bars
  const distributionStats = useMemo(() => {
    let created = 0;
    let edited = 0;
    let deleted = 0;
    let other = 0;

    chartData.forEach((d) => {
      created += d.created;
      edited += d.edited;
      deleted += d.deleted;
      other += d.other;
    });

    const grandTotal = created + edited + deleted + other || 1;

    return [
      { id: 'created', label: 'Created / Added', count: created, pct: Math.round((created / grandTotal) * 100), color: 'bg-emerald-500' },
      { id: 'edited', label: 'Edits & Updates', count: edited, pct: Math.round((edited / grandTotal) * 100), color: 'bg-blue-500' },
      { id: 'deleted', label: 'Deleted Items', count: deleted, pct: Math.round((deleted / grandTotal) * 100), color: 'bg-rose-500' },
      { id: 'other', label: 'Other Activity', count: other, pct: Math.round((other / grandTotal) * 100), color: 'bg-amber-500' },
    ];
  }, [chartData]);

  // Find peak activity day
  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.total - a.total)[0];
  }, [chartData]);

  // Color config for Recharts matching the design
  const colors = {
    edited: '#3B82F6', // Blue / Teal
    created: '#10B981', // Green / Emerald
    deleted: '#F43F5E', // Red / Rose
    other: '#F59E0B', // Amber
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* ── LEFT PANEL: Recharts Sales-Overview Style Line Chart (col-span-8) ── */}
        <div
          className={`lg:col-span-8 rounded-xl p-3.5 border transition-colors shadow-sm flex flex-col justify-between ${
            darkMode
              ? 'bg-[#121214] border-[#27272a] text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/20">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Activity Timeline
                  {selectedDate && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Filtered: {selectedDate}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {/* Top Right Controls & Legend */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Legend dots */}
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-medium mr-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 border border-blue-400" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Edits</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-400" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Created</span>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className={`flex items-center p-0.5 rounded-lg border text-[11px] ${darkMode ? 'bg-[#18181b] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
                {(['14d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      timeRange === range
                        ? darkMode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-blue-600 shadow-sm'
                        : darkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>

              {selectedDate && (
                <button
                  onClick={() => onDateSelect && onDateSelect('')}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                    darkMode
                      ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Recharts Linear Area + Line Chart View */}
          <div className="w-full pt-2 min-h-[135px]">
            <ResponsiveContainer width="100%" height={135}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length && onDateSelect) {
                    onDateSelect(e.activePayload[0].payload.dateStr);
                  }
                }}
              >
                <defs>
                  {/* Linear Gradient Backgrounds */}
                  <linearGradient id="editedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.edited} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors.edited} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.created} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={colors.created} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                {/* Horizontal Dashed Grid */}
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={darkMode ? "#27272a" : "#e2e8f0"}
                  horizontal={true}
                  vertical={false}
                />

                {/* X Axis */}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  dy={4}
                />

                {/* Y Axis */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  dx={-2}
                  allowDecimals={false}
                />

                {/* Selected Date Reference Line */}
                {selectedDate && (
                  <ReferenceLine
                    x={
                      chartData.find((d) => d.dateStr === selectedDate)?.month || ''
                    }
                    stroke={colors.edited}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* Custom Tooltip */}
                <Tooltip
                  content={<CustomTooltip darkMode={darkMode} />}
                  cursor={{
                    stroke: darkMode ? '#3f3f46' : '#cbd5e1',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />

                {/* Gradient Area under Edits */}
                <Area
                  type="linear"
                  dataKey="editedArea"
                  name="Edits"
                  stroke="transparent"
                  fill="url(#editedGradient)"
                  strokeWidth={0}
                  dot={false}
                  activeDot={false}
                />

                {/* Linear Line: Edits */}
                <Line
                  type="linear"
                  dataKey="edited"
                  name="Edits & Updates"
                  stroke={colors.edited}
                  strokeWidth={1.75}
                  dot={{
                    fill: darkMode ? '#121214' : '#ffffff',
                    strokeWidth: 1.5,
                    r: 3.5,
                    stroke: colors.edited,
                  }}
                  activeDot={{
                    r: 5.5,
                    strokeWidth: 2.5,
                    fill: colors.edited,
                  }}
                />

                {/* Linear Line: Created */}
                <Line
                  type="linear"
                  dataKey="created"
                  name="Created Items"
                  stroke={colors.created}
                  strokeWidth={1.75}
                  dot={{
                    fill: darkMode ? '#121214' : '#ffffff',
                    strokeWidth: 1.5,
                    r: 3.5,
                    stroke: colors.created,
                  }}
                  activeDot={{
                    r: 5.5,
                    strokeWidth: 2.5,
                    fill: colors.created,
                  }}
                />

                {/* Linear Line: Deleted */}
                <Line
                  type="linear"
                  dataKey="deleted"
                  name="Deleted"
                  stroke={colors.deleted}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{
                    fill: darkMode ? '#121214' : '#ffffff',
                    strokeWidth: 1.5,
                    r: 3,
                    stroke: colors.deleted,
                  }}
                />

                {/* Linear Line: Other */}
                <Line
                  type="linear"
                  dataKey="other"
                  name="Other"
                  stroke={colors.other}
                  strokeWidth={1.25}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── RIGHT PANEL: Activity Distribution (col-span-4) ── */}
        <div
          className={`lg:col-span-4 rounded-xl p-3.5 border transition-colors shadow-sm flex flex-col justify-between ${
            darkMode
              ? 'bg-[#121214] border-[#27272a] text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800/20">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs">Activity Distribution</h3>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                {timeRange}
              </span>
            </div>

            {/* Horizontal Bar Chart Items */}
            <div className="space-y-2 pt-2.5">
              {distributionStats.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="flex justify-between items-center text-[11px] font-medium">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.count}
                      </span>
                      <span className="font-bold min-w-[26px] text-right text-[11px]">
                        {item.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Track */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <motion.div
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly / Insight Summary Box at Bottom */}
          <div className={`mt-2 p-2 rounded-lg border text-[11px] space-y-1 ${
            darkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Activity Insights</span>
            </div>
            <ul className="space-y-0.5 text-[10px] opacity-90 pl-4 list-disc">
              {peakDay ? (
                <li>
                  Peak: <strong className="font-semibold">{peakDay.month}</strong> ({peakDay.total} actions)
                </li>
              ) : (
                <li>No activity recorded</li>
              )}
              <li>Top: <strong className="font-semibold">{[...distributionStats].sort((a,b)=>b.count-a.count)[0]?.label}</strong></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActivityGraph;
