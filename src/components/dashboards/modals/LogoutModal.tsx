// src/components/dashboards/modals/LogoutModal.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoutModalProps {
  show: boolean;
  darkMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  show,
  darkMode,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">Logout Confirmation</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className={`px-4 py-2 border rounded ${
                  darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;