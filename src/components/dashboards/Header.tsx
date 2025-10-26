// src/components/dashboards/Header.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  lastEditInfo?: {
    timestamp: Date | null;
    userName?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, darkMode, lastEditInfo }) => {
  const [lastEditedText, setLastEditedText] = useState<string>('No changes yet');

  // Fungsi untuk menghitung waktu relatif
  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // Format tanggal lengkap jika lebih dari 7 hari
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Update teks setiap menit untuk memperbarui waktu relatif
  useEffect(() => {
    const updateLastEditedText = () => {
      if (!lastEditInfo?.timestamp) {
        setLastEditedText('No changes yet');
        return;
      }

      const relativeTime = getRelativeTime(lastEditInfo.timestamp);
      const userPrefix = lastEditInfo.userName ? `by ${lastEditInfo.userName} ` : '';
      setLastEditedText(`Last edited ${userPrefix}${relativeTime}`);
    };

    // Update immediately
    updateLastEditedText();

    // Update every minute
    const interval = setInterval(updateLastEditedText, 60000);

    return () => clearInterval(interval);
  }, [lastEditInfo]);

  return (
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
              {lastEditedText}
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
};

export default Header;