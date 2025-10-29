import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HistoryEntry {
  id: string;
  userName: string;
  userRole: 'SUPERUSER' | 'ADMIN' | 'UMUM';
  action: 'create' | 'edit' | 'delete';
  target: 'note' | 'database' | 'schedule';
  targetName?: string;
  timestamp: Date;
  description: string;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  getLastChange: () => HistoryEntry | null;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('appHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setHistory(historyWithDates);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('appHistory', JSON.stringify(history));
    }
  }, [history]);

  const addHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  const getLastChange = (): HistoryEntry | null => {
    return history.length > 0 ? history[0] : null;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('appHistory');
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addHistory,
        getLastChange,
        clearHistory
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
