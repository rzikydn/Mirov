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

export interface NotificationItem {
  id: number;
  title: string;
  subtitle: string;
  releasedAt: string; // ISO date string
  count?: number;
  imageSrc?: string;
  imageObjectFit?: 'cover' | 'contain' | 'fill';
  imageObjectPosition?: string;
}

export const rawNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Offline-First Architecture',
    subtitle: 'Work offline & background auto-sync',
    releasedAt: new Date().toISOString(), // Released today
  },
  {
    id: 2,
    title: 'New User Activity Log UI',
    subtitle: 'Sleek layout & 60 FPS performance',
    releasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    imageSrc: newUserActivityLogImg,
  },
];

export function formatRelativeTime(releasedAtIso: string): string {
  const now = Date.now();
  const releaseTime = new Date(releasedAtIso).getTime();
  const diffMs = now - releaseTime;
  if (diffMs < 0) return 'Just now';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return 'Just now';
  if (diffHours < 24) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks === 2) return '2 weeks ago';
  return `${diffDays} days ago`;
}

export function getActiveNotifications(): NotificationItem[] {
  const now = Date.now();
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
  return rawNotifications.filter(item => {
    const releaseTime = new Date(item.releasedAt).getTime();
    return (now - releaseTime) <= FOURTEEN_DAYS_MS;
  });
}

export function getActiveNotificationCount(): number {
  return getActiveNotifications().length;
}

const cardTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
  mass: 0.8,
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -48,
    scaleX: 1 - i * 0.04,
    transformOrigin: 'top center',
  },
  expanded: {
    marginTop: i === 0 ? 0 : 8,
    scaleX: 1,
    transformOrigin: 'top center',
  },
});

const getCardContentVariants = (i: number) => ({
  collapsed: {
    opacity: i === 0 ? 1 : 0,
    transition: { duration: 0.15 }
  },
  expanded: {
    opacity: 1,
    transition: { duration: 0.2, delay: 0.05 }
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
  const activeNotifications = getActiveNotifications();

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
        {activeNotifications.map((notification, i) => (
          <motion.div
            key={notification.id}
            className={`rounded-xl px-4 py-2.5 shadow-sm transition-shadow duration-200 relative border transform-gpu overflow-hidden ${
              darkMode
                ? 'bg-[#27272a] border-neutral-700/70 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            variants={getCardVariants(i)}
            transition={cardTransition}
            style={{
              zIndex: activeNotifications.length - i,
            }}
          >
            <motion.div variants={getCardContentVariants(i)}>
              <div className="flex justify-between items-center">
                <h1 className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                  {notification.imageSrc ? (
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
                  ) : (
                    <span>{notification.title}</span>
                  )}
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
                <span>{formatRelativeTime(notification.releasedAt)}</span>
                &nbsp;•&nbsp;
                <span>{notification.subtitle}</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 px-1">
        <div className={`size-5 rounded-full text-xs flex items-center justify-center font-bold ${
          darkMode ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-neutral-700'
        }`}>
          {activeNotifications.length}
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
