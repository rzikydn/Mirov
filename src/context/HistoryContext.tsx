import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/history`;

export interface HistoryEntry {
  id: number;
  userName: string;
  userRole: 'SUPERUSER' | 'ADMIN' | 'UMUM';
  action: 'create' | 'edit' | 'delete';
  target: 'note' | 'database' | 'schedule';
  targetName?: string;
  createdAt: Date;
  description: string;
  userId: number;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  getLastChange: () => HistoryEntry | null;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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
      const response = await fetch(API_URL, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const historyWithDates = data.data.map((entry: any) => ({
            ...entry,
            createdAt: new Date(entry.createdAt)
          }));
          setHistory(historyWithDates);
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Load history on mount and set up polling for real-time updates
  useEffect(() => {
    // Initial fetch
    refreshHistory();

    // Poll for updates every 5 seconds for real-time sync
    const pollInterval = setInterval(() => {
      refreshHistory();
    }, 5000); // 5 seconds

    return () => clearInterval(pollInterval);
  }, []);

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
      }
    } catch (error) {
      console.error('Error adding history:', error);
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
