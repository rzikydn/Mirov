// src/components/dashboards/modals/ExportModal.tsx
// Modal for exporting database to JSON or Excel

import React from 'react';
import { motion } from 'framer-motion';
import { X, FileJson, FileSpreadsheet } from 'lucide-react';
import { Database } from '../../../types/database';
import { exportToJSON, exportToXLSX } from '../../../utils/exportUtils';

interface ExportModalProps {
  show: boolean;
  darkMode: boolean;
  database: Database;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ show, darkMode, database, onClose }) => {
  const handleExportJSON = () => {
    exportToJSON(database);
    onClose();
  };

  const handleExportXLSX = async () => {
    await exportToXLSX(database);
    onClose();
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
            Export Database
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

        {/* Export Options */}
        <div className="space-y-3">
          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              darkMode
                ? 'border-gray-700 hover:border-blue-600 hover:bg-gray-800'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <FileJson className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Export as JSON
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Download database structure and data as JSON file
              </p>
            </div>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportXLSX}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              darkMode
                ? 'border-gray-700 hover:border-green-600 hover:bg-gray-800'
                : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
            }`}
          >
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <FileSpreadsheet className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Export as Excel
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Download as formatted XLSX spreadsheet file
              </p>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Database: <span className="font-medium">{database.name}</span>
            <br />
            Columns: {database.columns.length} | Rows: {database.rows.length}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
