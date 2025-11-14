// src/components/dashboards/EventDetailSidebar.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, AlignLeft, Trash2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  description?: string;
}

interface EventDetailSidebarProps {
  show: boolean;
  darkMode: boolean;
  selectedDate: Date | null;
  events: CalendarEvent[];
  canDelete: boolean;
  onClose: () => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventDetailSidebar: React.FC<EventDetailSidebarProps> = ({
  show,
  darkMode,
  selectedDate,
  events,
  canDelete,
  onClose,
  onDeleteEvent,
}) => {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const dayEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-full lg:w-96 ${
              darkMode ? 'bg-[#0f1419] border-[#1e2530]' : 'bg-white border-gray-200'
            } border-l shadow-2xl z-50 flex flex-col`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 lg:p-6 border-b ${
              darkMode ? 'border-[#1e2530]' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg lg:text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Event Details
              </h2>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-[#1a1f2e]' : 'hover:bg-gray-100'
                }`}
                aria-label="Close"
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
              {selectedDate && (
                <div className={`flex items-center gap-3 mb-6 p-4 rounded-lg ${
                  darkMode ? 'bg-[#1a1f2e]' : 'bg-blue-50'
                }`}>
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-blue-600' : 'bg-blue-500'
                  }`}>
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Selected Date
                    </p>
                    <p className={`text-base font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* Events List */}
              {dayEvents.length > 0 ? (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Events ({dayEvents.length})
                  </h3>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? 'bg-[#1a1f2e] border-[#1e2530] hover:border-blue-500/50'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      } transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className={`text-base font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </h4>
                        {canDelete && (
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              darkMode
                                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                            }`}
                            aria-label="Delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {event.description && (
                        <div className="flex gap-2 mt-2">
                          <AlignLeft className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <p className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className={`p-4 rounded-full mb-4 ${
                    darkMode ? 'bg-[#1a1f2e]' : 'bg-gray-100'
                  }`}>
                    <CalendarIcon className={`w-8 h-8 ${
                      darkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <p className={`text-base font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No events for this day
                  </p>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Click on a date to add an event
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailSidebar;
