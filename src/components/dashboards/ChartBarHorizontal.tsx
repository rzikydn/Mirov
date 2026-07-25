import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
} from "../ui/card"

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBetween(date: Date, start: Date, end: Date) {
  const t = date.getTime()
  const [s, e] = start <= end ? [start.getTime(), end.getTime()] : [end.getTime(), start.getTime()]
  return t >= s && t <= e
}

export function ChartBarHorizontal({
  darkMode,
  onApplyDateRange,
  onResetDateRange,
}: {
  darkMode?: boolean
  onApplyDateRange?: (start: Date | null, end: Date | null) => void
  onResetDateRange?: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [selecting, setSelecting] = useState(false)

  // Pending selection state (before Apply)
  const [pendingStart, setPendingStart] = useState<Date | null>(null)
  const [pendingEnd, setPendingEnd] = useState<Date | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  // Previous month overflow days
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1)

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = []

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const date = new Date(viewYear, viewMonth - 1, d)
      cells.push({ day: d, date, isCurrentMonth: false })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      cells.push({ day: d, date, isCurrentMonth: true })
    }

    // Next month leading days
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const date = new Date(viewYear, viewMonth + 1, d)
        cells.push({ day: d, date, isCurrentMonth: false })
      }
    }

    return cells
  }, [viewYear, viewMonth, daysInMonth, firstDay, prevMonthDays])

  const handleDayClick = (date: Date) => {
    if (!selecting || !pendingStart) {
      setPendingStart(date)
      setPendingEnd(null)
      setSelecting(true)
    } else {
      setPendingEnd(date)
      setSelecting(false)
    }
  }

  const handleCancel = () => {
    setPendingStart(null)
    setPendingEnd(null)
    setRangeStart(null)
    setRangeEnd(null)
    setSelecting(false)

    if (onResetDateRange) {
      onResetDateRange()
    }
  }

  const handleApply = () => {
    if (pendingStart) {
      const [s, e] = pendingEnd
        ? (pendingStart <= pendingEnd ? [pendingStart, pendingEnd] : [pendingEnd, pendingStart])
        : [pendingStart, pendingStart]

      setRangeStart(s)
      setRangeEnd(e)

      if (onApplyDateRange) {
        onApplyDateRange(s, e)
      }
    }
  }

  // Display range: pending (while picking) or confirmed
  const displayStart = pendingStart || rangeStart
  const displayEnd = pendingEnd || (pendingStart ? null : rangeEnd)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }
  const prevYear = () => setViewYear(viewYear - 1)
  const nextYear = () => setViewYear(viewYear + 1)

  return (
    <Card className={`overflow-hidden border transition-colors shadow-sm flex flex-col h-full ${
      darkMode ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <CardHeader className={`flex flex-col justify-center h-20 px-6 py-0 border-b space-y-0 ${
        darkMode ? 'border-gray-800' : 'border-gray-100'
      }`}>
        {/* Month/Year navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={prevYear} className={`p-1 rounded hover:bg-gray-200/80 transition-colors ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={prevMonth} className={`p-1 rounded hover:bg-gray-200/80 transition-colors ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <span className={`text-sm font-semibold select-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {MONTHS[viewMonth]} {viewYear}
          </span>

          <div className="flex items-center gap-1">
            <button onClick={nextMonth} className={`p-1 rounded hover:bg-gray-200/80 transition-colors ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={nextYear} className={`p-1 rounded hover:bg-gray-200/80 transition-colors ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between p-4 pt-3">
        {/* Day headers */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, i) => {
              const isToday = isSameDay(cell.date, today)
              const isStart = displayStart && isSameDay(cell.date, displayStart)
              const isEnd = displayEnd && isSameDay(cell.date, displayEnd)
              const isInRange = displayStart && displayEnd && isBetween(cell.date, displayStart, displayEnd)
              const isSelected = isStart || isEnd

              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(cell.date)}
                  className={`
                    relative text-xs h-9 w-full flex items-center justify-center transition-all
                    ${!cell.isCurrentMonth
                      ? darkMode ? 'text-gray-600' : 'text-gray-300'
                      : darkMode ? 'text-gray-200' : 'text-gray-700'
                    }
                    ${isSelected
                      ? darkMode
                        ? 'bg-white text-gray-900 font-bold rounded-md z-10'
                        : 'bg-gray-800 text-white font-bold rounded-md z-10'
                      : ''
                    }
                    ${isInRange && !isSelected
                      ? darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                      : ''
                    }
                    ${isToday && !isSelected
                      ? darkMode
                        ? 'ring-1 ring-gray-500 rounded-md font-semibold'
                        : 'ring-1 ring-gray-300 rounded-md font-semibold'
                      : ''
                    }
                    ${!isSelected ? darkMode ? 'hover:bg-gray-700/60 rounded-md' : 'hover:bg-gray-100 rounded-md' : ''}
                  `}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cancel / Apply buttons */}
        <div className={`flex items-center gap-3 mt-4 pt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            onClick={handleCancel}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
              darkMode
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-white text-gray-900 hover:bg-gray-200'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            Apply
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(ChartBarHorizontal);
