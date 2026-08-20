// src/components/dashboards/DateFilter.tsx
// Custom date filter picker with calendar popup rendered via Portal

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { formatDateIndonesian } from '../../utils/dateFormatUtils';

interface DateFilterProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  darkMode: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Get calendar grid for a given month/year (weeks starting Monday)
function getCalendarDays(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  // Previous month's trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    currentWeek.push(new Date(year, month - 1, prevMonthLastDay - i));
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month's leading days
  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, month + 1, nextDay++));
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ── Calendar Dropdown Portal Component ──
interface CalendarDropdownProps {
  anchorRect: DOMRect;
  darkMode: boolean;
  selectedDate: Date | null;
  today: Date;
  onApply: (date: Date) => void;
  onCancel: () => void;
}

const CalendarDropdown: React.FC<CalendarDropdownProps> = ({
  anchorRect,
  darkMode,
  selectedDate,
  today,
  onApply,
  onCancel,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Init view month/year from selected date or today
  const initDate = selectedDate || today;
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);

  // Calculate position
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const dropdownHeight = 370;
    const dropdownWidth = 280;
    const gap = 4;

    let top: number;
    let left: number;

    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      // Show below
      top = anchorRect.bottom + gap;
    } else {
      // Show above
      top = anchorRect.top - dropdownHeight - gap;
    }

    // Horizontal alignment: try to align left, clamp to window width
    left = anchorRect.left;
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    if (left < 8) left = 8;

    // Clamp top
    if (top < 8) top = 8;
    if (top + dropdownHeight > window.innerHeight - 8) {
      top = window.innerHeight - dropdownHeight - 8;
    }

    setPos({ top, left });
  }, [anchorRect]);

  // Close on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onCancel]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Close on scroll of any ancestor
  useEffect(() => {
    const handleScroll = () => onCancel();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [onCancel]);

  const weeks = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonthFn = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const nextMonthFn = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };
  const prevYearFn = () => setViewYear(y => y - 1);
  const nextYearFn = () => setViewYear(y => y + 1);

  const handleApplyClick = () => {
    if (tempDate) {
      onApply(tempDate);
    }
  };

  if (!pos) return null;

  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: 280,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          boxShadow: darkMode
            ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'",
        }}
      >
        {/* Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NavButton onClick={prevYearFn} darkMode={darkMode} title="Previous Year">
              <ChevronsLeft style={{ width: 16, height: 16 }} />
            </NavButton>
            <NavButton onClick={prevMonthFn} darkMode={darkMode} title="Previous Month">
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </NavButton>
          </div>

          <span style={{
            fontSize: 14,
            fontWeight: 600,
            userSelect: 'none',
            color: darkMode ? '#e5e7eb' : '#1f2937',
          }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NavButton onClick={nextMonthFn} darkMode={darkMode} title="Next Month">
              <ChevronRight style={{ width: 16, height: 16 }} />
            </NavButton>
            <NavButton onClick={nextYearFn} darkMode={darkMode} title="Next Year">
              <ChevronsRight style={{ width: 16, height: 16 }} />
            </NavButton>
          </div>
        </div>

        {/* Day Names Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px 4px' }}>
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 0',
                userSelect: 'none',
                color: darkMode ? '#6b7280' : '#9ca3af',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ padding: '0 12px 8px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {week.map((date, di) => {
                const isCurrentMonth = date.getMonth() === viewMonth;
                const isToday = isSameDate(date, today);
                const isSelected = tempDate ? isSameDate(date, tempDate) : false;

                let bgColor = 'transparent';
                let textColor = darkMode ? '#e5e7eb' : '#374151';
                let fontWeight: number | string = 400;
                let borderRadius = 8;

                if (isSelected) {
                  bgColor = darkMode ? '#ffffff' : '#111827';
                  textColor = darkMode ? '#111827' : '#ffffff';
                  fontWeight = 600;
                } else if (isToday) {
                  bgColor = darkMode ? '#374151' : '#e5e7eb';
                  textColor = darkMode ? '#ffffff' : '#111827';
                  fontWeight = 500;
                } else if (!isCurrentMonth) {
                  textColor = darkMode ? '#4b5563' : '#d1d5db';
                }

                return (
                  <button
                    key={di}
                    onClick={() => setTempDate(date)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight,
                      color: textColor,
                      backgroundColor: bgColor,
                      borderRadius,
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      padding: 0,
                      lineHeight: 1,
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isToday) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else if (isToday && !isSelected) {
                        e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#e5e7eb';
                      }
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderTop: `1px solid ${darkMode ? '#374151' : '#f3f4f6'}`,
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
              backgroundColor: 'transparent',
              color: darkMode ? '#d1d5db' : '#4b5563',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApplyClick}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: 'none',
              backgroundColor: darkMode ? '#ffffff' : '#111827',
              color: darkMode ? '#111827' : '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#e5e7eb' : '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#ffffff' : '#111827';
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const NavButton: React.FC<{
  onClick: () => void;
  darkMode: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, darkMode, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      backgroundColor: 'transparent',
      color: darkMode ? '#9ca3af' : '#6b7280',
      cursor: 'pointer',
      outline: 'none',
      padding: 0,
      transition: 'background-color 0.1s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {children}
  </button>
);

// ── Main DateFilter component ──
const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  darkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const today = useMemo(() => new Date(), []);

  const selectedDate = useMemo(() => {
    return value ? new Date(value + 'T00:00:00') : null;
  }, [value]);

  const displayValue = value ? formatDateIndonesian(value) : '';

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback((date: Date) => {
    const newVal = toYYYYMMDD(date);
    onChange(newVal);
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  }, [onChange]);

  const displayValueShort = useMemo(() => {
    if (!displayValue) return '';
    const parts = displayValue.split(', ');
    return parts.length > 1 ? parts[1] : displayValue;
  }, [displayValue]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 xs:gap-2 px-2 py-1.5 xs:px-3 xs:py-2 rounded-lg text-sm cursor-pointer select-none transition-colors border w-auto xs:min-w-[150px] ${
          darkMode
            ? 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        
        {/* Desktop display */}
        <span className="hidden xs:inline flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {displayValue || 'Filter by Date'}
        </span>
        
        {/* Mobile display */}
        <span className="xs:hidden text-xs overflow-hidden text-ellipsis whitespace-nowrap">
          {displayValueShort || 'Date'}
        </span>

        {value && (
          <button
            onClick={handleClear}
            className={`p-0.5 rounded-full ${
              darkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            title="Clear date filter"
          >
            <X className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
          </button>
        )}
      </div>

      {isOpen && anchorRect && (
        <CalendarDropdown
          anchorRect={anchorRect}
          darkMode={darkMode}
          selectedDate={selectedDate}
          today={today}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default DateFilter;
