'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TriggerRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface PreviewLinkCardContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRect: TriggerRect | null;
  cursorPos: { x: number; y: number };
  href?: string;
  followCursor?: boolean | 'x' | 'y';
}

const PreviewLinkCardContext = createContext<PreviewLinkCardContextType | undefined>(undefined);

const usePreviewLinkCard = () => {
  const context = useContext(PreviewLinkCardContext);
  if (!context) {
    throw new Error('PreviewLinkCard components must be used within a PreviewLinkCard provider');
  }
  return context;
};

export interface PreviewLinkCardProps {
  children: React.ReactNode;
  href?: string;
  followCursor?: boolean | 'x' | 'y';
  className?: string;
}

export const PreviewLinkCard: React.FC<PreviewLinkCardProps> = ({
  children,
  href = '#',
  followCursor = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const updateRect = (e?: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTriggerRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });

      if (e) {
        setCursorPos({
          x: e.clientX,
          y: e.clientY,
        });
      }
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    updateRect(e);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateRect(e);
  };

  return (
    <PreviewLinkCardContext.Provider
      value={{ isOpen, setIsOpen, triggerRect, cursorPos, href, followCursor }}
    >
      <span
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </span>
    </PreviewLinkCardContext.Provider>
  );
};

export interface PreviewLinkCardTriggerProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  target?: string;
}

export const PreviewLinkCardTrigger: React.FC<PreviewLinkCardTriggerProps> = ({
  children,
  className = '',
  href,
  target,
}) => {
  const { href: contextHref } = usePreviewLinkCard();
  const finalHref = href || contextHref || '#';

  return (
    <a
      href={finalHref}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`underline underline-offset-4 decoration-1 hover:decoration-2 transition-all cursor-pointer font-medium ${className}`}
    >
      {children}
    </a>
  );
};

export interface PreviewLinkCardPanelProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  followCursor?: boolean | 'x' | 'y';
  target?: string;
  className?: string;
}

export const PreviewLinkCardPanel: React.FC<PreviewLinkCardPanelProps> = ({
  children,
  className = '',
}) => {
  const { isOpen, triggerRect, cursorPos, followCursor } = usePreviewLinkCard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !triggerRect) return null;

  // Calculate position floating to the right or top of the trigger
  // Position to the right of the popup card to escape any sidebar/modal bounds
  const panelWidth = 240;
  const panelHeight = 140;

  let top = triggerRect.top - 20;
  let left = triggerRect.right + 16;

  // If followCursor is enabled, follow cursor X/Y gracefully
  if (followCursor && cursorPos.x > 0) {
    top = cursorPos.y - panelHeight / 2;
    left = cursorPos.x + 16;
  }

  // Viewport bounds check
  if (left + panelWidth > window.innerWidth - 10) {
    left = triggerRect.left - panelWidth - 16;
  }
  if (top < 10) top = 10;
  if (top + panelHeight > window.innerHeight - 10) {
    top = window.innerHeight - panelHeight - 10;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: -6 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.92, x: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 99999,
          }}
          className={`w-60 p-1.5 rounded-2xl shadow-2xl border bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border-gray-200 dark:border-gray-800 pointer-events-none ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export interface PreviewLinkCardImageProps {
  src?: string;
  alt?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  objectPosition?: string;
}

export const PreviewLinkCardImage: React.FC<PreviewLinkCardImageProps> = ({
  src,
  alt = 'Preview image',
  className = '',
  objectFit = 'cover',
  objectPosition,
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-xl"
          style={{ objectFit, objectPosition }}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-3 gap-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-semibold">
            UI
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {alt}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500">
            Preview
          </span>
        </div>
      )}
    </div>
  );
};
