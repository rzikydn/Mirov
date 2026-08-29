// src/styles/dateInputStyles.ts
// CSS styles for date input calendar icon in dark mode

export const dateInputStyles = `
  /* Custom styles for date input in dark mode */
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0);
    opacity: 0.6;
    cursor: pointer;
  }

  input[type="date"].dark-mode::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.8;
  }

  input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;
