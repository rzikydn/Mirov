"use client";

import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from "@/components/kibo-ui/contribution-graph/index";
import { formatISO } from "date-fns";
import { cn } from "@/lib/utils";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// Assuming we want to show 1 year back from today exactly like typical contribution graphs, 
// or from start of year to end of year like in the example code data.
import { eachDayOfInterval, endOfYear, startOfYear } from "date-fns";
import { HistoryEntry } from "../../context/HistoryContext";

interface ActivityGraphProps {
  history: HistoryEntry[];
  darkMode: boolean;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ history, darkMode, onDateSelect, selectedDate }) => {
  const now = new Date();
  const maxLevel = 4;

  // Indonesian date formatter
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const formatIndonesianDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = useMemo(() => {
    // 1. Calculate activity counts per date string (yyyy-MM-dd)
    const counts = new Map<string, number>();
    history.forEach(entry => {
      const d = new Date(entry.createdAt);
      // Create local YYYY-MM-DD
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts.set(dateString, (counts.get(dateString) || 0) + 1);
    });

    let maxCount = 0;
    counts.forEach(count => {
      if (count > maxCount) maxCount = count;
    });
    
    // To avoid dividing by zero or having too small scale
    if (maxCount < 4) maxCount = 4;

    // 2. Generate days of the entire year
    const days = eachDayOfInterval({
      start: startOfYear(now),
      end: endOfYear(now),
    });

    return days.map((date) => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const count = counts.get(dateString) || 0;
      
      // Calculate level (0-4) based on actual activity vs maxCount
      const level = count === 0 ? 0 : Math.ceil((count / maxCount) * maxLevel);

      return {
        date: formatISO(date, { representation: "date" }),
        count,
        level,
      };
    });
  }, [history]);

  // Doughnut Chart Data Calculation
  const filteredForChart = useMemo(() => {
    if (!selectedDate) return history;
    return history.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
      return entryDateStr === selectedDate;
    });
  }, [history, selectedDate]);

  const activityStats = useMemo(() => {
    let creates = 0;
    let edits = 0;
    let deletes = 0;
    let others = 0;

    filteredForChart.forEach((entry) => {
      const action = entry.action?.toLowerCase() || '';
      const desc = entry.description?.toLowerCase() || '';
      
      if (action === 'create' || action === 'added' || desc.includes('created') || desc.includes('added')) {
        creates++;
      } else if (action === 'edit' || action === 'update' || desc.includes('updated') || desc.includes('changed')) {
        edits++;
      } else if (action === 'delete' || action === 'remove' || desc.includes('deleted') || desc.includes('removed')) {
        deletes++;
      } else {
        others++;
      }
    });

    return [
      { id: 'creates', label: 'Created / Added', count: creates, color: '#10B981', ringColor: darkMode ? 'ring-[#10B981]/30' : 'ring-[#10B981]/20' },
      { id: 'edits', label: 'Edited / Updated', count: edits, color: '#3B82F6', ringColor: darkMode ? 'ring-[#3B82F6]/30' : 'ring-[#3B82F6]/20' },
      { id: 'deletes', label: 'Deleted / Removed', count: deletes, color: '#EF4444', ringColor: darkMode ? 'ring-[#EF4444]/30' : 'ring-[#EF4444]/20' },
      { id: 'others', label: 'Other Activity', count: others, color: '#F59E0B', ringColor: darkMode ? 'ring-[#F59E0B]/30' : 'ring-[#F59E0B]/20' },
    ];
  }, [filteredForChart, darkMode]);

  const totalActivities = filteredForChart.length;
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate SVG stroke offsets
  let currentOffset = 0;
  let chartSegments: any[] = [];
  
  const activeStats = activityStats.filter(stat => stat.count > 0);
  
  if (activeStats.length === 0) {
    chartSegments = [];
  } else if (activeStats.length === 1) {
    chartSegments = activeStats.map((stat: any) => ({
      ...stat,
      dashArray: `${circumference} ${circumference}`,
      dashOffset: 0
    }));
  } else {
    const visualGap = 8;
    const capCompensation = strokeWidth; // strokeLinecap="round" adds strokeWidth/2 to BOTH ends
    const totalGaps = activeStats.length * (visualGap + capCompensation);
    const availableCircumference = Math.max(0, circumference - totalGaps);

    chartSegments = activeStats.map((stat: any) => {
      const percentage = totalActivities > 0 ? stat.count / totalActivities : 0;
      const dashLength = percentage * availableCircumference;
      
      const segment = {
        ...stat,
        dashArray: `${dashLength} ${circumference}`,
        dashOffset: -currentOffset - (capCompensation / 2),
      };
      
      const advance = dashLength + capCompensation + visualGap;
      currentOffset += advance;
      
      return segment;
    });
  }

  // Dynamic block sizing based on container width
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [blockSize, setBlockSize] = useState(11);
  const [blockMargin, setBlockMargin] = useState(3);

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    const calculateBlockSize = () => {
      const width = container.clientWidth;
      const dayLabelWidth = 36; // space reserved for day-of-week labels
      const availableWidth = width - dayLabelWidth;
      
      // Calculate how many weeks we are actually rendering.
      // E.g., startOfYear to endOfYear is usually 53 weeks across.
      const weeks = 53; 

      // Use exact floating point math to perfectly stretch without right-side blank space
      const cellTotal = availableWidth / weeks;
      
      // At least 2px margin, scale margin proportionally
      const margin = Math.max(2, cellTotal * 0.22);
      
      // At least 6px size
      const size = Math.max(6, cellTotal - margin);
      
      setBlockSize(size);
      setBlockMargin(margin);
    };

    calculateBlockSize();
    const observer = new ResizeObserver(() => calculateBlockSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`p-5 rounded-xl border mb-8 w-full
      flex flex-col lg:flex-row gap-8 items-start
      ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
    `}>
      {/* LEFT: Contribution Graph */}
      <div ref={graphContainerRef} className="flex-1 min-w-0 w-full overflow-x-auto hide-scrollbar">
        <div className="pb-2">
          <ContributionGraph 
            data={data} 
            blockSize={blockSize} 
            blockMargin={blockMargin}
          >
            <ContributionGraphCalendar className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {({ activity, dayIndex, weekIndex }) => (
                <ContributionGraphBlock
                  activity={activity}
                  className={cn(
                    'transition-all duration-300 cursor-pointer stroke-1',
                    darkMode ? 'data-[level="0"]:fill-[#374151]' : 'data-[level="0"]:fill-[#ebedf0]',
                    darkMode ? 'data-[level="1"]:fill-[#0e4429]' : 'data-[level="1"]:fill-[#9be9a8]',
                    darkMode ? 'data-[level="2"]:fill-[#006d32]' : 'data-[level="2"]:fill-[#40c463]',
                    darkMode ? 'data-[level="3"]:fill-[#26a641]' : 'data-[level="3"]:fill-[#30a14e]',
                    darkMode ? 'data-[level="4"]:fill-[#39d353]' : 'data-[level="4"]:fill-[#216e39]',
                    selectedDate && selectedDate !== activity.date ? 'opacity-20' : 'opacity-100',
                    selectedDate === activity.date ? (darkMode ? 'stroke-white' : 'stroke-gray-900') : 'stroke-transparent'
                  )}
                  dayIndex={dayIndex}
                  weekIndex={weekIndex}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                    const rect = (e.target as SVGRectElement).getBoundingClientRect();
                    setTooltip({
                      date: activity.date,
                      count: activity.count,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                    });
                  }}
                  onMouseLeave={() => {
                    tooltipTimeout.current = setTimeout(() => setTooltip(null), 150);
                  }}
                  onClick={() => {
                    if (onDateSelect) {
                      onDateSelect(activity.date);
                    }
                  }}
                />
              )}
            </ContributionGraphCalendar>
            <div className="flex justify-between items-center mt-4 text-xs">
              <span className={`${darkMode ? 'text-gray-400' : 'text-[#64748B]'}`}>
                {history.length} activities in {new Date().getFullYear()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`${darkMode ? 'text-gray-400' : 'text-[#64748B]'}`}>Less</span>
                <div className="flex gap-1">
                  <div className={`w-[10px] h-[10px] rounded-[2px] ${darkMode ? 'bg-[#374151]' : 'bg-[#ebedf0]'}`} />
                  <div className={`w-[10px] h-[10px] rounded-[2px] ${darkMode ? 'bg-[#0e4429]' : 'bg-[#9be9a8]'}`} />
                  <div className={`w-[10px] h-[10px] rounded-[2px] ${darkMode ? 'bg-[#006d32]' : 'bg-[#40c463]'}`} />
                  <div className={`w-[10px] h-[10px] rounded-[2px] ${darkMode ? 'bg-[#26a641]' : 'bg-[#30a14e]'}`} />
                  <div className={`w-[10px] h-[10px] rounded-[2px] ${darkMode ? 'bg-[#39d353]' : 'bg-[#216e39]'}`} />
                </div>
                <span className={`${darkMode ? 'text-gray-400' : 'text-[#64748B]'}`}>More</span>
              </div>
            </div>
          </ContributionGraph>
        </div>
      </div>

      {/* RIGHT: Doughnut Chart Insight */}
      <div className={`w-full lg:w-[380px] flex-shrink-0 flex flex-col sm:flex-row items-center sm:items-start lg:pt-1 gap-6
        border-t lg:border-t-0 lg:border-l ${darkMode ? 'border-gray-700' : 'border-gray-100'} lg:pl-6 lg:pr-4 pt-6 sm:pt-4
      `}>
        {/* Doughnut SVG */}
          <div className="relative w-[150px] h-[150px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 150 150">
              {/* Background Ring */}
              <circle
                cx="75" cy="75" r={radius}
                fill="none"
                stroke={darkMode ? '#374151' : '#F3F4F6'}
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {chartSegments.map((seg) => (
                <motion.circle
                  key={`${selectedDate || 'all'}-${seg.id}`}
                  cx="75" cy="75" r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: circumference }}
                  animate={{ strokeDasharray: seg.dashArray as string, strokeDashoffset: seg.dashOffset as number }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              ))}
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                key={(selectedDate || 'all') + '-total'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {totalActivities}
              </motion.span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-3">
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Activity Insight
            </h3>
            {activityStats.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span 
                    className={`w-3 h-3 rounded-full flex-shrink-0 ring-4 ${stat.ringColor}`} 
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className={`whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </span>
                </div>
                <span className={`font-semibold pl-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${darkMode ? '#374151' : '#E5E7EB'};
          border-radius: 10px;
        }
      `}} />

      {/* Custom Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap
            ${darkMode ? 'bg-gray-900 text-gray-100 border border-gray-700' : 'bg-gray-800 text-white'}
          `}>
            <div className="font-semibold">{formatIndonesianDate(tooltip.date)}</div>
            <div className={`mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`}>
              {tooltip.count} {tooltip.count === 1 ? 'kontribusi' : 'kontribusi'}
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center -mt-[1px]">
            <div className={`w-2 h-2 rotate-45 ${darkMode ? 'bg-gray-900 border-r border-b border-gray-700' : 'bg-gray-800'}`} />
          </div>
        </div>
      )}
    </div>
  );
};
