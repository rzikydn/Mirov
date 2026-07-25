import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/history`;

export interface HistoryEntry {
  id: number;
  userName: string;
  userRole: 'SUPERUSER' | 'ADMIN' | 'UMUM';
  action: 'create' | 'edit' | 'delete' | 'added'; // Lowercase for consistency in UI
  target: 'note' | 'database' | 'schedule'; // Lowercase for consistency in UI
  targetName?: string;
  createdAt: Date;
  description: string;
  userId: number;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  deleteHistory: (id: number) => Promise<boolean>;
  deleteBulkHistory: (ids: number[]) => Promise<boolean>;
  getLastChange: () => HistoryEntry | null;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { isAuthenticated } = useAuth();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch history from backend
  const refreshHistory = async () => {
    try {
      // Fetch all history entries by passing limit=-1
      const response = await fetch(`${API_URL}?limit=-1`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const historyWithDates = data.data.map((entry: any) => ({
            ...entry,
            action: entry.action.toLowerCase(), // Convert to lowercase
            target: entry.target.toLowerCase(), // Convert to lowercase
            // Fix timezone: MySQL CURRENT_TIMESTAMP stores local time,
            // but Drizzle serializes with 'Z' (UTC) suffix.
            // Strip the Z to parse as local time instead of UTC.
            createdAt: (() => {
              const raw = String(entry.createdAt);
              // If it ends with Z, remove it so it's parsed as local time
              const cleaned = raw.endsWith('Z') ? raw.slice(0, -1) : raw;
              return new Date(cleaned);
            })()
          }));
          setHistory(historyWithDates);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch history:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error);
    }
  };

  // Load history whenever authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshHistory();
    } else {
      setHistory([]);
    }
  }, [isAuthenticated]);

  const addHistory = async (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          userName: entry.userName,
          userRole: entry.userRole,
          action: entry.action.toUpperCase(), // Convert to enum format (CREATE, EDIT, DELETE)
          target: entry.target.toUpperCase(), // Convert to enum format (NOTE, DATABASE, SCHEDULE)
          targetName: entry.targetName,
          description: entry.description
        })
      });

      if (response.ok) {
        // Refresh history to get latest
        await refreshHistory();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to add history:', errorData);
      }
    } catch (error) {
      console.error('❌ Error adding history:', error);
    }
  };

  const deleteHistory = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Refresh history to get latest
        await refreshHistory();
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete history:', errorData.message || errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting history:', error);
      return false;
    }
  };

  const deleteBulkHistory = async (ids: number[]): Promise<boolean> => {
    try {
      // Optimistic UI update (Instant 0ms)
      setHistory((prev) => prev.filter((item) => !ids.includes(item.id)));

      // Send parallel delete requests to server
      await Promise.all(
        ids.map((id) =>
          fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          })
        )
      );

      return true;
    } catch (error) {
      console.error('❌ Error during bulk delete history:', error);
      await refreshHistory();
      return false;
    }
  };

  const getLastChange = (): HistoryEntry | null => {
    return history.length > 0 ? history[0] : null;
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addHistory,
        deleteHistory,
        deleteBulkHistory,
        getLastChange,
        refreshHistory
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};
