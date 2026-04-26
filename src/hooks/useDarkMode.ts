// src/hooks/useDarkMode.ts

import { useState, useRef, useCallback } from 'react';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);
  const isAnimating = useRef(false);

  const toggleDarkMode = useCallback((e?: React.MouseEvent) => {
    // Get click coordinates for circular reveal origin
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;

    // Prevent multiple animations at once
    if (isAnimating.current) return;

    // Check if View Transition API is supported
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function'
    ) {
      isAnimating.current = true;

      // Set CSS custom properties for the animation origin
      document.documentElement.style.setProperty('--reveal-x', `${x}px`);
      document.documentElement.style.setProperty('--reveal-y', `${y}px`);

      // Calculate the maximum radius needed to cover the entire screen
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      document.documentElement.style.setProperty('--reveal-radius', `${maxRadius}px`);

      const transition = (document as any).startViewTransition(() => {
        setDarkMode((prev) => !prev);
      });

      transition.finished.then(() => {
        isAnimating.current = false;
      }).catch(() => {
        isAnimating.current = false;
      });
    } else {
      // Fallback: use manual clip-path animation
      isAnimating.current = true;

      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Create overlay for clip-path animation
      const overlay = document.createElement('div');
      overlay.id = 'theme-transition-overlay';

      // The overlay shows the NEW theme colors
      const willBeDark = !darkMode;
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: none;
        background: ${willBeDark ? '#111827' : '#f1f5f9'};
        clip-path: circle(0px at ${x}px ${y}px);
        transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      `;

      document.body.appendChild(overlay);

      // Trigger the animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;
        });
      });

      // Apply the actual theme change midway through the animation
      setTimeout(() => {
        setDarkMode((prev) => !prev);
      }, 250);

      // Remove overlay after animation completes
      setTimeout(() => {
        overlay.remove();
        isAnimating.current = false;
      }, 650);
    }
  }, [darkMode]);

  return { darkMode, toggleDarkMode };
};