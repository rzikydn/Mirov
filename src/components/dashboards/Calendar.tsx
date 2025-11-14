// src/components/dashboards/Calendar.tsx

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import NewEventModal from './modals/NewEventModal';
import EventDetailSidebar from './EventDetailSidebar';
import { useHistory } from '../../context/HistoryContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  description?: string;
}

interface CalendarProps {
  darkMode: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ darkMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showEventSidebar, setShowEventSidebar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { addHistory } = useHistory();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleAddEvent = async (title: string, description: string, date: Date) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title,
      description,
      date,
    };
    setEvents([...events, newEvent]);

    // Add to history
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    await addHistory({
      userName: user.name || 'Unknown User',
      userRole: user.role || 'UMUM',
      action: 'create',
      target: 'calendar',
      targetName: title,
      description: `Created calendar event "${title}" on ${formatDate(date)}${description ? ` - ${description}` : ''}`
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find(event => event.id === eventId);
    if (!eventToDelete) return;

    setEvents(events.filter(event => event.id !== eventId));

    // Add to history
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    await addHistory({
      userName: user.name || 'Unknown User',
      userRole: user.role || 'UMUM',
      action: 'delete',
      target: 'calendar',
      targetName: eventToDelete.title,
      description: `Deleted calendar event "${eventToDelete.title}" from ${formatDate(eventToDelete.date)}`
    });
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);

    // Check if there are events on this day
    const dayHasEvents = events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });

    if (dayHasEvents) {
      // Show sidebar with event details
      setShowEventSidebar(true);
    } else {
      // Show modal to add new event
      setShowNewEventModal(true);
    }
  };

  const hasEventsOnDay = (day: number) => {
    return events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Calculate previous month's trailing days
  const prevMonthDays = [];
  const prevMonth = new Date(year, month, 0);
  const prevMonthLastDay = prevMonth.getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthLastDay - i);
  }

  // Calculate next month's leading days
  const totalCells = 42; // 6 rows × 7 days
  const currentMonthCells = daysInMonth + startingDayOfWeek;
  const nextMonthDays = totalCells - currentMonthCells;

  return (
    <div className={`flex-1 flex flex-col ${darkMode ? 'bg-[#1a1f2e]' : 'bg-gray-50'} overflow-hidden`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-[#0f1419]' : 'bg-white'} px-6 py-4 flex items-center justify-between`}>
        {/* Left: Date Display */}
        <div className="flex items-center gap-4">
          <div className={`${darkMode ? 'bg-[#2a3142]' : 'bg-gray-100'} rounded-xl px-4 py-3`}>
            <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide font-semibold`}>
              {monthNames[month].slice(0, 3)}
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} leading-none mt-1`}>
              {new Date().getDate()}
            </div>
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {monthNames[month]}, {year}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
              {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()} - {monthNames[new Date(year, month + 1, 0).getMonth()]} {new Date(year, month + 1, 0).getDate()}, {new Date(year, month + 1, 0).getFullYear()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a3142]' : 'hover:bg-gray-100'} transition-colors`}
            aria-label="Search"
          >
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a3142]' : 'hover:bg-gray-100'} transition-colors`}
              aria-label="Previous month"
            >
              <ChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>

            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                darkMode
                  ? 'bg-[#2a3142] text-white hover:bg-[#3a4152]'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } transition-colors`}
            >
              Today
            </button>

            <button
              onClick={nextMonth}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a3142]' : 'hover:bg-gray-100'} transition-colors`}
              aria-label="Next month"
            >
              <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date());
              setShowNewEventModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`flex-1 ${darkMode ? 'bg-[#1a1f2e]' : 'bg-gray-50'} p-3 overflow-hidden`}>
        <div className={`${darkMode ? 'bg-[#0f1419]' : 'bg-white'} rounded-xl border ${darkMode ? 'border-[#1e2530]' : 'border-gray-200'} h-full flex flex-col overflow-hidden`}>
          <div className="min-w-[700px] overflow-auto custom-scrollbar flex-1">
            {/* Day Headers */}
            <div className={`grid grid-cols-7 sticky top-0 z-10 ${darkMode ? 'bg-[#0f1419]' : 'bg-white'}`}>
              {dayNames.map((day) => (
                <div
                  key={day}
                  className={`p-3 text-center text-sm font-semibold ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  } border-b ${darkMode ? 'border-[#1e2530]' : 'border-gray-200'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {/* Previous month days */}
              {prevMonthDays.map((day, index) => (
                <div
                  key={`prev-${index}`}
                  className={`h-[85px] lg:h-[90px] p-2 border-b border-r ${
                    darkMode ? 'border-[#1e2530]' : 'border-gray-200'
                  } ${darkMode ? 'bg-[#1a1f2e]/50' : 'bg-gray-50'}`}
                >
                  <div className={`text-sm ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                    {day}
                  </div>
                </div>
              ))}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayHasEvent = hasEventsOnDay(day);
                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-[85px] lg:h-[90px] p-2 border-b border-r ${
                      darkMode ? 'border-[#1e2530]' : 'border-gray-200'
                    } ${
                      dayHasEvent
                        ? darkMode
                          ? 'bg-blue-500/10 hover:bg-blue-500/20'
                          : 'bg-blue-50 hover:bg-blue-100'
                        : darkMode
                        ? 'bg-[#0f1419] hover:bg-[#1a1f2e]'
                        : 'bg-white hover:bg-gray-50'
                    } cursor-pointer transition-colors relative`}
                  >
                    <div className={`text-sm font-medium ${
                      isToday(day)
                        ? 'bg-white text-gray-900 w-7 h-7 rounded-full flex items-center justify-center font-semibold'
                        : darkMode
                        ? 'text-gray-300'
                        : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    {dayHasEvent && (
                      <div className="absolute bottom-2 right-2">
                        <div className={`w-2 h-2 rounded-full ${
                          darkMode ? 'bg-blue-400' : 'bg-blue-500'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Next month days */}
              {Array.from({ length: nextMonthDays }, (_, i) => i + 1).map((day) => (
                <div
                  key={`next-${day}`}
                  className={`h-[85px] lg:h-[90px] p-2 border-b border-r ${
                    darkMode ? 'border-[#1e2530]' : 'border-gray-200'
                  } ${darkMode ? 'bg-[#1a1f2e]/50' : 'bg-gray-50'}`}
                >
                  <div className={`text-sm ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                    {day}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <NewEventModal
        show={showNewEventModal}
        darkMode={darkMode}
        selectedDate={selectedDate || new Date()}
        onClose={() => {
          setShowNewEventModal(false);
          setSelectedDate(null);
        }}
        onSave={handleAddEvent}
      />

      {/* Event Detail Sidebar */}
      <EventDetailSidebar
        show={showEventSidebar}
        darkMode={darkMode}
        selectedDate={selectedDate}
        events={events}
        onClose={() => {
          setShowEventSidebar(false);
          setSelectedDate(null);
        }}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
};

export default Calendar;
