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

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeConfig {
  greeting: string;
  gradientFrom: string;
  gradientTo: string;
  skyColor: string;
  groundColor: string;
  accentColor: string;
}

const timeConfigs: Record<TimeOfDay, TimeConfig> = {
  morning: {
    greeting: 'Good Morning',
    gradientFrom: '#FFE5B4', // Peach
    gradientTo: '#FFB366', // Orange
    skyColor: '#87CEEB', // Sky blue
    groundColor: '#F4A460', // Sandy brown
    accentColor: '#FFD700', // Gold (sun)
  },
  afternoon: {
    greeting: 'Good Afternoon',
    gradientFrom: '#87CEEB', // Sky blue
    gradientTo: '#4FC3F7', // Light blue
    skyColor: '#5DADE2', // Bright blue
    groundColor: '#52BE80', // Green
    accentColor: '#F9E79F', // Yellow (sun)
  },
  evening: {
    greeting: 'Good Evening',
    gradientFrom: '#FF8C66', // Coral
    gradientTo: '#9575CD', // Purple
    skyColor: '#7986CB', // Blue purple
    groundColor: '#4A5F7F', // Dark blue
    accentColor: '#F8BBD0', // Pink
  },
  night: {
    greeting: 'Good Night',
    gradientFrom: '#1A237E', // Dark blue
    gradientTo: '#283593', // Navy
    skyColor: '#0D1B2A', // Very dark blue
    groundColor: '#1B263B', // Dark navy
    accentColor: '#E8EAF6', // Moon white
  },
};

const Header: React.FC<HeaderProps> = ({ onMenuClick, darkMode, lastEditInfo }) => {
  const [lastEditedText, setLastEditedText] = useState<string>('No changes yet');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  // Fungsi untuk mendapatkan waktu saat ini
  const getTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Update time of day
  useEffect(() => {
    setTimeOfDay(getTimeOfDay());

    // Update every minute
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  const config = timeConfigs[timeOfDay];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden flex-shrink-0 ${
        darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
      }`}
      style={{ height: '100px' }}
    >
      {/* Animated Background Illustration */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Sky */}
        <motion.div
          key={timeOfDay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${config.gradientFrom} 0%, ${config.gradientTo} 50%, ${config.skyColor} 100%)`,
          }}
        />

        {/* Sun/Moon */}
        <motion.div
          key={`celestial-${timeOfDay}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute rounded-full"
          style={{
            width: '35px',
            height: '35px',
            right: timeOfDay === 'morning' ? '12%' : timeOfDay === 'afternoon' ? '50%' : '15%',
            top: timeOfDay === 'morning' ? '18%' : timeOfDay === 'afternoon' ? '12%' : '22%',
            background: config.accentColor,
            boxShadow: `0 0 25px ${config.accentColor}`,
            opacity: timeOfDay === 'night' ? 0.9 : 1,
          }}
        />

        {/* Stars (only at night) */}
        {timeOfDay === 'night' && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute rounded-full bg-white"
                style={{
                  width: '2px',
                  height: '2px',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 55}%`,
                }}
              />
            ))}
          </>
        )}

        {/* Clouds */}
        {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
          <>
            <motion.div
              animate={{ x: [0, 50, 0] }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute"
              style={{ left: '8%', top: '12%', opacity: 0.55 }}
            >
              <svg width="55" height="20" viewBox="0 0 80 30" fill="none">
                <ellipse cx="20" cy="20" rx="20" ry="10" fill="white" opacity="0.8" />
                <ellipse cx="40" cy="15" rx="25" ry="12" fill="white" opacity="0.8" />
                <ellipse cx="60" cy="20" rx="18" ry="10" fill="white" opacity="0.8" />
              </svg>
            </motion.div>
            <motion.div
              animate={{ x: [0, -30, 0] }}
              transition={{ duration: 25, repeat: Infinity }}
              className="absolute"
              style={{ right: '12%', top: '18%', opacity: 0.45 }}
            >
              <svg width="42" height="16" viewBox="0 0 60 25" fill="none">
                <ellipse cx="15" cy="15" rx="15" ry="8" fill="white" opacity="0.8" />
                <ellipse cx="35" cy="12" rx="20" ry="10" fill="white" opacity="0.8" />
              </svg>
            </motion.div>
          </>
        )}

        {/* Ground/Hills */}
        <motion.div
          key={`ground-${timeOfDay}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-0 w-full"
          style={{ height: '40%' }}
        >
          {/* Back Hill */}
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,60 Q360,10 720,50 T1440,60 L1440,120 L0,120 Z"
              fill={config.groundColor}
              opacity="0.5"
            />
          </svg>
          {/* Front Hill */}
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              d="M0,50 Q360,0 720,40 T1440,50 L1440,100 L0,100 Z"
              fill={config.groundColor}
              opacity="0.8"
            />
          </svg>
        </motion.div>

        {/* City Silhouette */}
        <motion.div
          key={`city-${timeOfDay}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 flex items-end justify-center"
          style={{ height: '35%', opacity: 0.7 }}
        >
          {[30, 45, 35, 50, 40, 55, 38, 48].map((height, i) => (
            <div
              key={i}
              className="mx-1"
              style={{
                width: `${20 + i * 5}px`,
                height: `${height}%`,
                background: darkMode ? '#1F2937' : '#374151',
                opacity: 0.6,
              }}
            >
              {/* Windows */}
              <div className="grid grid-cols-2 gap-1 p-1">
                {[...Array(Math.floor(height / 15))].map((_, j) => (
                  <div
                    key={j}
                    className="w-1 h-1"
                    style={{
                      background: Math.random() > 0.5 ? config.accentColor : 'transparent',
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Birds (morning/afternoon only) */}
        {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`bird-${i}`}
                animate={{
                  x: [-50, window.innerWidth + 50],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 15 + i * 3,
                  repeat: Infinity,
                  delay: i * 5,
                }}
                className="absolute"
                style={{
                  left: '-50px',
                  top: `${20 + i * 15}%`,
                }}
              >
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                  <path
                    d="M0,5 Q5,0 10,5 Q15,0 20,5"
                    stroke={darkMode ? '#1F2937' : '#374151'}
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 h-full flex items-center">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div>
            <motion.h1
              key={config.greeting}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xl sm:text-2xl font-bold text-white mb-0 leading-tight"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {config.greeting}, Team!
            </motion.h1>
            <p
              className="text-xs sm:text-sm text-white/90 mt-0.5"
              style={{
                textShadow: '0 1px 5px rgba(0,0,0,0.3)',
              }}
            >
              {lastEditedText}
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;