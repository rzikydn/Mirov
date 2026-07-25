// src/hooks/useDarkMode.ts

import { useState, useCallback } from 'react';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setDarkMode((prev) => !prev);
  }, []);

  return { darkMode, toggleDarkMode };
};