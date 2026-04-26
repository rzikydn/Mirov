import React, { useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContributionGraphProps {
  activityCountMap: Map<string, number>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  darkMode: boolean;
  year?: number;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  activityCountMap,
  selectedDate,
  onSelectDate,
  darkMode,
  year = new Date().getFullYear(),
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 53 weeks for the given year
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    const startDate = new Date(year, 0, 1);
    
    // Retreat to the first Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    for (let week = 0; week < 53; week++) {
      const currentWeek: Date[] = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + (week * 7) + day);
        currentWeek.push(d);
      }
      w.push(currentWeek);
      // Stop if we have covered the entire year and are in a new year
      if (currentWeek[6].getFullYear() > year) {
        break;
      }
    }
    return w;
  }, [year]);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const getIntensity = (count: number) => {
    if (count === 0) return darkMode ? 'bg-gray-800' : 'bg-gray-100';
    if (count <= 3) return darkMode ? 'bg-emerald-900/60' : 'bg-emerald-200';
    if (count <= 8) return darkMode ? 'bg-emerald-700/70' : 'bg-emerald-400';
    if (count <= 15) return darkMode ? 'bg-emerald-600' : 'bg-emerald-500';
    return darkMode ? 'bg-emerald-500' : 'bg-emerald-600';
  };

  const totalActivities = useMemo(() => {
    let total = 0;
    activityCountMap.forEach((count, key) => {
      if (key.startsWith(year.toString())) {
        total += count;
      }
    });
    return total;
  }, [activityCountMap, year]);

  // Months label positions
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let currentMonth = -1;
    weeks.forEach((week, index) => {
      const month = week[0].getMonth(); // Use the first day of the week to decide month
      if (month !== currentMonth && week[0].getFullYear() === year) {
        labels.push({ text: MONTH_NAMES_SHORT[month], colIndex: index });
        currentMonth = month;
      }
    });
    return labels;
  }, [weeks, year]);

  // Scroll to end on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#202020] border-gray-800' : 'bg-white border-gray-100'} w-full`}>
      <div className="flex items-center gap-2 relative">
        {/* Y-axis Day labels */}
        <div className={`flex flex-col gap-[3px] text-[10px] pr-2 pt-[22px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="h-3 flex items-center">Sun</div>
          <div className="h-3 flex items-center opacity-0">Mon</div>
          <div className="h-3 flex items-center">Tue</div>
          <div className="h-3 flex items-center opacity-0">Wed</div>
          <div className="h-3 flex items-center">Thu</div>
          <div className="h-3 flex items-center opacity-0">Fri</div>
          <div className="h-3 flex items-center">Sat</div>
        </div>

        {/* Scrollable Graph Area */}
        <div className="flex-1 overflow-x-auto hide-scrollbar relative pb-1" ref={scrollRef}>
          {/* Months Header */}
          <div className="relative h-[20px] mb-1 min-w-max">
            {monthLabels.map((lbl, i) => (
              <span
                key={i}
                className={`absolute text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                style={{ left: `${lbl.colIndex * 15}px` }}
              >
                {lbl.text}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px] min-w-max">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dIndex) => {
                  const key = getDateKey(day);
                  const count = activityCountMap.get(key) || 0;
                  const isSelected = isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={dIndex}
                      onClick={() => onSelectDate(day)}
                      title={`${day.toDateString()}: ${count} activities`}
                      className={`w-3 h-3 rounded-sm transition-all
                        ${getIntensity(count)}
                        ${isSelected ? 'ring-1 ring-blue-500 ring-offset-1 ' + (darkMode ? 'ring-offset-[#202020]' : 'ring-offset-white') : 'hover:ring-1 ' + (darkMode ? 'hover:ring-gray-400' : 'hover:ring-gray-400')}
                      `}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer controls and Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button onClick={handleScrollLeft} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Progress Bar visual simulation like in the image */}
          <div className={`hidden sm:block h-2 w-32 md:w-64 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
             <div className={`h-full rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-400'}`} style={{ width: '100%' }}></div>
          </div>
          
          <button onClick={handleScrollRight} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalActivities} activities in {year}
        </div>

        <div className="flex items-center gap-1.5 self-end text-xs text-gray-500">
          <span>Less</span>
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-emerald-900/60' : 'bg-emerald-200'}`}></div>
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-emerald-700/70' : 'bg-emerald-400'}`}></div>
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`}></div>
          <div className={`w-3 h-3 rounded-sm ${darkMode ? 'bg-emerald-500' : 'bg-emerald-600'}`}></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
