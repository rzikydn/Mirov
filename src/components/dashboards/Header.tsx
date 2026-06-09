// src/components/dashboards/Header.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';
import { getTimeAgo } from '../../utils/timeAgo';
import { HyperText } from '@/components/ui/hyper-text';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  user?: { name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null;
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

const Header: React.FC<HeaderProps> = ({ onMenuClick, darkMode, user }) => {
  const { getLastChange, history } = useHistory();
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

  // Update teks setiap kali history berubah atau setiap menit untuk memperbarui waktu relatif
  useEffect(() => {
    const updateLastEditedText = () => {
      const lastChange = getLastChange();

      if (!lastChange) {
        setLastEditedText('No changes yet');
        return;
      }

      const timeAgo = getTimeAgo(lastChange.createdAt);
      setLastEditedText(`Changed ${timeAgo}`);
    };

    // Update immediately
    updateLastEditedText();

    // Update every minute for relative time
    const interval = setInterval(updateLastEditedText, 60000);

    return () => clearInterval(interval);
  }, [getLastChange, history]); // Added history dependency to trigger on history changes

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

        {/* Stars (only at night) - STATIC NO ANIMATION */}
        {timeOfDay === 'night' && (
          <>
            {[...Array(15)].map((_, i) => (
              <div
                key={`star-${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  width: '2px',
                  height: '2px',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 55}%`,
                  opacity: 0.8,
                }}
              />
            ))}
          </>
        )}

        {/* Clouds - STATIC NO ANIMATION */}
        {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
          <>
            <div
              className="absolute"
              style={{
                left: '8%',
                top: '12%',
                opacity: 0.5,
              }}
            >
              <svg width="50" height="18" viewBox="0 0 80 30" fill="none">
                <ellipse cx="20" cy="20" rx="20" ry="10" fill="white" opacity="0.7" />
                <ellipse cx="40" cy="15" rx="25" ry="12" fill="white" opacity="0.7" />
                <ellipse cx="60" cy="20" rx="18" ry="10" fill="white" opacity="0.7" />
              </svg>
            </div>
            <div
              className="absolute"
              style={{
                right: '12%',
                top: '18%',
                opacity: 0.4,
              }}
            >
              <svg width="38" height="14" viewBox="0 0 60 25" fill="none">
                <ellipse cx="15" cy="15" rx="15" ry="8" fill="white" opacity="0.7" />
                <ellipse cx="35" cy="12" rx="20" ry="10" fill="white" opacity="0.7" />
              </svg>
            </div>
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

        {/* Birds REMOVED - No animation for better performance */}
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
            <HyperText
              key={config.greeting}
              as="h1"
              duration={2000}
              animateInterval={8000}
              className="text-2xl sm:text-3xl font-bold text-white mb-0 leading-tight space-mono-bold"
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {`${config.greeting}, Team!`}
            </HyperText>
            {/* Only show last edited for ADMIN and SUPERUSER */}
            {user && user.role !== 'UMUM' && (
              <p
                className="text-xs sm:text-sm text-white/90 mt-0.5"
                style={{
                  textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                }}
              >
                {lastEditedText}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;