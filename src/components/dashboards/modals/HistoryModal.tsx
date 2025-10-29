import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, Database as DatabaseIcon, Calendar } from 'lucide-react';
import { HistoryEntry } from '../../../context/HistoryContext';
import { getTimeAgo } from '../../../utils/timeAgo';

interface HistoryModalProps {
  show: boolean;
  darkMode: boolean;
  history: HistoryEntry[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ show, darkMode, history, onClose }) => {
  if (!show) return null;

  const getIcon = (target: 'note' | 'database' | 'schedule') => {
    switch (target) {
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'database':
        return <DatabaseIcon className="w-4 h-4" />;
      case 'schedule':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: 'create' | 'edit' | 'delete') => {
    switch (action) {
      case 'create':
        return darkMode ? 'text-green-400' : 'text-green-600';
      case 'edit':
        return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'delete':
        return darkMode ? 'text-red-400' : 'text-red-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
        } rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Activity History
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No activity yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      {getIcon(entry.target)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {entry.userName}
                        </span>
                        {' '}
                        <span className={getActionColor(entry.action)}>
                          {entry.action === 'create' ? 'added' : entry.action === 'edit' ? 'changed' : 'deleted'}
                        </span>
                        {' '}
                        <span>
                          {entry.target === 'note' ? 'note' : entry.target === 'database' ? 'database' : 'schedule'}
                        </span>
                        {entry.targetName && (
                          <>
                            {' '}
                            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              "{entry.targetName}"
                            </span>
                          </>
                        )}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {getTimeAgo(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded text-sm font-medium ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryModal;
