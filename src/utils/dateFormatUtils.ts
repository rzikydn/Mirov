// src/utils/dateFormatUtils.ts
// Utility functions for formatting dates in Indonesian format

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format date to Indonesian format: "Selasa, 11 Nov 2025"
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in Indonesian
 */
export const formatDateIndonesian = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues

  const dayName = DAYS_ID[date.getDay()];
  const day = date.getDate();
  const monthName = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${monthName} ${year}`;
};

/**
 * Convert Indonesian formatted date back to YYYY-MM-DD format
 * @param formattedDate - Date in format "Selasa, 11 Nov 2025"
 * @returns Date string in YYYY-MM-DD format
 */
export const parseIndonesianDate = (formattedDate: string): string => {
  if (!formattedDate) return '';

  // Parse format: "Selasa, 11 Nov 2025"
  const parts = formattedDate.split(',');
  if (parts.length !== 2) return '';

  const dateParts = parts[1].trim().split(' ');
  if (dateParts.length !== 3) return '';

  const day = parseInt(dateParts[0], 10);
  const monthName = dateParts[1];
  const year = parseInt(dateParts[2], 10);

  const monthIndex = MONTHS_ID.indexOf(monthName);
  if (monthIndex === -1) return '';

  const date = new Date(year, monthIndex, day);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
