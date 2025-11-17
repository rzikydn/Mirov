// src/utils/databaseUtils.ts
// Database operation utilities

import { Database } from '../types/database';

const API_URL = `${import.meta.env.VITE_API_URL}/api/databases`;

// Get authorization headers
export const getAuthHeaders = (token?: string | null): HeadersInit => {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };
};

// Update database with backend sync
export const updateDatabase = async (
  database: Database,
  token?: string | null,
  addHistory?: (historyData: {
    userName: string;
    userRole: string;
    action: 'edit';
    target: 'database';
    targetName: string;
    description: string;
  }) => Promise<void>,
  userName?: string,
  userRole?: string
): Promise<boolean> => {
  // Sync with backend if database has a numeric ID (already saved)
  if (typeof database.id === 'number') {
    try {
      console.log('🔄 Sending to backend - columnWidths:', database.columnWidths);
      const response = await fetch(`${API_URL}/${database.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          name: database.name,
          description: database.description,
          icon: database.icon,
          columns: database.columns,
          rows: database.rows,
          columnWidths: database.columnWidths
        })
      });

      if (response.ok) {
        // Add to history if provided
        if (addHistory && userName && userRole) {
          await addHistory({
            userName,
            userRole,
            action: 'edit',
            target: 'database',
            targetName: database.name,
            description: `${userName} changed database "${database.name}"`
          });
        }
        return true;
      } else {
        console.error('Failed to sync database with backend');
        return false;
      }
    } catch (error) {
      console.error('Error syncing database:', error);
      return false;
    }
  }
  return true;
};

// Generate unique key from label
export const generateKeyFromLabel = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Scroll element into view smoothly
export const scrollToElement = (element: HTMLElement | null): void => {
  if (element) {
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }, 100);
  }
};
