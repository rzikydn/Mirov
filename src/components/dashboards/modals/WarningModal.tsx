// src/components/dashboards/modals/WarningModal.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface WarningModalProps {
  show: boolean;
  darkMode: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({
  show,
  darkMode,
  title = 'Warning',
  message = 'Please check your input and try again.',
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onConfirm}
        >
          <motion.div
            className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>

            {/* Message */}
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 ml-12`}>
              {message}
            </p>

            {/* OK Button */}
            <div className="flex justify-end">
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarningModal;
