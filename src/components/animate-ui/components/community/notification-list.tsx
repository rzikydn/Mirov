'use client';

import { RotateCcw, ArrowUpRight } from 'lucide-react';
import { motion, type Transition } from 'framer-motion';
import {
  PreviewLinkCard,
  PreviewLinkCardTrigger,
  PreviewLinkCardPanel,
  PreviewLinkCardImage,
} from '../base/preview-link-card';

import newUserActivityLogImg from '@/assets/NewUserActivityLogUi.webp';
import collapsibleHeaderImg from '@/assets/CollapsibleHeaderTogle.webp';
import saveAndRefreshImg from '@/assets/SaveAndRefreshButton.webp';

interface NotificationItem {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  count?: number;
  imageSrc?: string;
  imageObjectFit?: 'cover' | 'contain' | 'fill';
  imageObjectPosition?: string;
}

const notifications: NotificationItem[] = [
  {
    id: 1,
    title: 'New User Activity Log UI',
    subtitle: 'Sleek layout & 60 FPS performance',
    time: 'tonight',
    imageSrc: newUserActivityLogImg,
  },
  {
    id: 2,
    title: 'Collapsible Header Toggle',
    subtitle: 'Hide header for expanded worksheet view',
    time: 'tonight',
    imageSrc: collapsibleHeaderImg,
    imageObjectPosition: 'right center',
  },
  {
    id: 3,
    title: 'Save & Refresh Buttons',
    subtitle: 'Realtime auto-save & instant status toasts',
    time: '2 weeks ago',
    imageSrc: saveAndRefreshImg,
    imageObjectFit: 'contain',
  },
];

const cardTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
  mass: 0.8,
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -46,
    scaleX: 1 - i * 0.05,
    transformOrigin: 'top center',
  },
  expanded: {
    marginTop: i === 0 ? 0 : 6,
    scaleX: 1,
    transformOrigin: 'top center',
  },
});

const textSwitchTransition: Transition = {
  duration: 0.2,
  ease: 'easeInOut',
};

const notificationTextVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
  expanded: { opacity: 0, y: -16, pointerEvents: 'none' as const },
};

const viewAllTextVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: 'none' as const },
  expanded: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
};

function NotificationList({ className, darkMode }: { className?: string; darkMode?: boolean }) {
  return (
    <motion.div
      className={`p-3 rounded-3xl w-full space-y-3 shadow-xl transition-colors select-none ${
        darkMode ? 'bg-[#18181b] text-white' : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
      } ${className || ''}`}
      initial="collapsed"
      whileHover="expanded"
      animate="collapsed"
    >
      <div>
        {notifications.map((notification, i) => (
          <motion.div
            key={notification.id}
            className={`rounded-xl px-4 py-2.5 shadow-sm transition-shadow duration-200 relative border transform-gpu ${
              darkMode
                ? 'bg-[#27272a] border-neutral-700/70 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            variants={getCardVariants(i)}
            transition={cardTransition}
            style={{
              zIndex: notifications.length - i,
            }}
          >
            <div className="flex justify-between items-center">
              <h1 className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                <PreviewLinkCard followCursor={true}>
                  <PreviewLinkCardTrigger className={`underline underline-offset-4 decoration-1 hover:decoration-2 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                    {notification.title}
                  </PreviewLinkCardTrigger>
                  <PreviewLinkCardPanel side="top" sideOffset={8}>
                    <PreviewLinkCardImage
                      src={notification.imageSrc}
                      alt={notification.title}
                      objectFit={notification.imageObjectFit}
                      objectPosition={notification.imageObjectPosition}
                    />
                  </PreviewLinkCardPanel>
                </PreviewLinkCard>
              </h1>
              {notification.count && (
                <div className={`flex items-center text-[11px] gap-0.5 font-medium ${
                  darkMode ? 'text-neutral-300' : 'text-neutral-500'
                }`}>
                  <RotateCcw className="size-3" />
                  <span>{notification.count}</span>
                </div>
              )}
            </div>
            <div className={`text-[11px] font-medium ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              <span>{notification.time}</span>
              &nbsp;•&nbsp;
              <span>{notification.subtitle}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 px-1">
        <div className={`size-5 rounded-full text-xs flex items-center justify-center font-bold ${
          darkMode ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-neutral-700'
        }`}>
          {notifications.length}
        </div>
        <span className="grid">
          <motion.span
            className={`text-xs font-semibold row-start-1 col-start-1 ${
              darkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
            variants={notificationTextVariants}
            transition={textSwitchTransition}
          >
            New Feature
          </motion.span>
          <motion.span
            className={`text-xs font-semibold flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1 ${
              darkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
            variants={viewAllTextVariants}
            transition={textSwitchTransition}
          >
            View all <ArrowUpRight className="size-3.5" />
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}

export { NotificationList };
