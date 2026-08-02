import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch, getCache, setCache } from '@/services/offlineSync';

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
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const cached = getCache<any[]>('history_logs', []);
    return cached.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
    }));
  });
  const { isAuthenticated } = useAuth();

  // Fetch history from backend with offline fallback
  const refreshHistory = useCallback(async () => {
    try {
      const { ok, data } = await apiFetch(`${API_URL}?limit=-1`, {}, 'history_logs');

      if (ok && data && data.data && Array.isArray(data.data)) {
        const historyWithDates = data.data.map((entry: any) => ({
          ...entry,
          action: (entry.action || 'edit').toLowerCase(),
          target: (entry.target || 'database').toLowerCase(),
          createdAt: (() => {
            const raw = String(entry.createdAt || '');
            const cleaned = raw.endsWith('Z') ? raw.slice(0, -1) : raw;
            const d = new Date(cleaned);
            return isNaN(d.getTime()) ? new Date() : d;
          })()
        }));
        setHistory(historyWithDates);
        setCache('history_logs', historyWithDates);
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error);
    }
  }, []);

  // Load history whenever authentication state changes or data synced
  useEffect(() => {
    if (isAuthenticated) {
      refreshHistory();
    } else {
      setHistory([]);
    }

    const handleDataSynced = () => {
      refreshHistory();
    };
    window.addEventListener('app:data-synced', handleDataSynced);

    return () => window.removeEventListener('app:data-synced', handleDataSynced);
  }, [isAuthenticated, refreshHistory]);

  const addHistory = async (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Optimistic UI Update (Instant 0ms update even when offline)
      const newEntry: HistoryEntry = {
        id: Date.now(),
        userId: user.id || 1,
        userName: entry.userName || 'User',
        userRole: entry.userRole || 'UMUM',
        action: (entry.action || 'edit').toLowerCase() as any,
        target: (entry.target || 'database').toLowerCase() as any,
        targetName: entry.targetName || '',
        description: entry.description || '',
        createdAt: new Date(),
      };

      setHistory((prev) => {
        const updated = [newEntry, ...prev];
        setCache('history_logs', updated);
        return updated;
      });

      // Send to server or queue for background sync if offline
      await apiFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          userName: entry.userName,
          userRole: entry.userRole,
          action: (entry.action || 'EDIT').toUpperCase(),
          target: (entry.target || 'DATABASE').toUpperCase(),
          targetName: entry.targetName,
          description: entry.description
        })
      });
    } catch (error) {
      console.error('❌ Error adding history:', error);
    }
  };

  const deleteHistory = async (id: number): Promise<boolean> => {
    try {
      // Optimistic UI Delete
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        setCache('history_logs', updated);
        return updated;
      });

      await apiFetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting history:', error);
      return false;
    }
  };

  const deleteBulkHistory = async (ids: number[]): Promise<boolean> => {
    try {
      // Optimistic UI Delete (Instant 0ms)
      setHistory((prev) => {
        const updated = prev.filter((item) => !ids.includes(item.id));
        setCache('history_logs', updated);
        return updated;
      });

      // Send delete requests via apiFetch (queueing if offline)
      await Promise.all(
        ids.map((id) =>
          apiFetch(`${API_URL}/${id}`, {
            method: 'DELETE'
          })
        )
      );

      return true;
    } catch (error) {
      console.error('❌ Error during bulk delete history:', error);
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
