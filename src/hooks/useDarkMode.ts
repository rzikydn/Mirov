// src/hooks/useDarkMode.ts

import { useState } from 'react';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return { darkMode, toggleDarkMode };
};