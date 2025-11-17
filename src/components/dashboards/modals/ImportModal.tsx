// src/components/dashboards/modals/ImportModal.tsx
// Modal for importing CSV files to database

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  show: boolean;
  darkMode: boolean;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ show, darkMode, onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
        } rounded-xl shadow-2xl max-w-md w-full p-6`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Import CSV File
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Description */}
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Import CSV file to automatically create table with columns and rows from your data.
          </p>
        </div>

        {/* Import Button */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={(e) => {
            onImport(e);
            onClose();
          }}
          className="hidden"
        />

        <button
          onClick={handleSelectFile}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all ${
            darkMode
              ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-800 text-white'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-900'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Select CSV File</span>
        </button>

        {/* Warning */}
        <div className={`mt-6 p-4 rounded-lg flex gap-3 ${
          darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
          <div>
            <h4 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>
              Important
            </h4>
            <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              Importing CSV will replace all current columns and rows in this table. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* CSV Format Info */}
        <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex items-start gap-2">
            <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <div>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Supported Format:
              </p>
              <ul className={`text-xs space-y-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• CSV files with semicolon (;) or comma (,) delimiter</li>
                <li>• First row should contain column headers</li>
                <li>• UTF-8 encoding supported</li>
                <li>• Column types auto-detected (text, number, date)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImportModal;
