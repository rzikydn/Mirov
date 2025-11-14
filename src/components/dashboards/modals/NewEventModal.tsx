// src/components/dashboards/modals/NewEventModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Type, AlignLeft } from 'lucide-react';

interface NewEventModalProps {
  show: boolean;
  darkMode: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSave: (title: string, description: string, date: Date) => void;
}

const NewEventModal: React.FC<NewEventModalProps> = ({
  show,
  darkMode,
  selectedDate,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(selectedDate);

  useEffect(() => {
    setEventDate(selectedDate);
  }, [selectedDate]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title, description, eventDate);
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } rounded-xl border shadow-2xl w-full max-w-md overflow-hidden`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 lg:p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className={`text-lg lg:text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    New Event
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Close"
                >
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 lg:p-6 space-y-4">
                {/* Title Input */}
                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Type className="w-4 h-4" />
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter event title..."
                    className={`w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg border text-sm lg:text-base ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                    autoFocus
                  />
                </div>

                {/* Date Input */}
                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CalendarIcon className="w-4 h-4" />
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(eventDate)}
                    onChange={(e) => setEventDate(new Date(e.target.value))}
                    className={`w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg border text-sm lg:text-base ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <AlignLeft className="w-4 h-4" />
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add event description..."
                    rows={4}
                    className={`w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg border text-sm lg:text-base resize-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 p-4 lg:p-6 border-t ${
                darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <button
                  onClick={onClose}
                  className={`px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className={`px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    title.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Create Event
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewEventModal;
