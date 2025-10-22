// src/components/dashboards/Header.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, darkMode }) => (
  <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border-b px-4 sm:px-6 lg:px-12 py-4 flex-shrink-0`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className={`lg:hidden p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0`}>
            Morning Team!
          </h1>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last edited 2 hours ago
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 ${
              darkMode ? 'border-gray-700' : 'border-white'
            } shadow-sm ${i !== 1 ? '-ml-3' : ''}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  </motion.header>
);

export default Header;