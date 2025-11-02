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
  deleteHistory: (id: number) => Promise<boolean>;
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
        console.log('📊 History fetched:', data);
        if (data.success && Array.isArray(data.data)) {
          const historyWithDates = data.data.map((entry: any) => ({
            ...entry,
            action: entry.action.toLowerCase(), // Convert to lowercase
            target: entry.target.toLowerCase(), // Convert to lowercase
            createdAt: new Date(entry.createdAt)
          }));
          setHistory(historyWithDates);
          console.log('✅ History updated, total entries:', historyWithDates.length);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch history:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error);
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

      console.log('📝 Adding history entry:', {
        userId: user.id,
        userName: entry.userName,
        userRole: entry.userRole,
        action: entry.action.toUpperCase(),
        target: entry.target.toUpperCase(),
        targetName: entry.targetName,
        description: entry.description
      });

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

      console.log('📡 History API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ History added successfully:', data);
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
      console.log('🗑️ Deleting history entry:', id);
      console.log('🔐 Using token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('👤 Current user:', JSON.parse(localStorage.getItem('user') || '{}'));

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      console.log('📡 Delete history API response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log('✅ History deleted successfully');
        // Refresh history to get latest
        await refreshHistory();
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete history:');
        console.error('   Status:', response.status);
        console.error('   Error data:', errorData);
        console.error('   Message:', errorData.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting history (exception):', error);
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
