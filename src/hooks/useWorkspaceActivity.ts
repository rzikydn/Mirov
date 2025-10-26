// src/hooks/useWorkspaceActivity.ts

import { useState, useCallback, useEffect } from 'react';

interface WorkspaceActivity {
  timestamp: Date | null;
  userName?: string;
}

/**
 * Custom hook untuk melacak aktivitas terakhir di workspace
 * Menyimpan informasi di localStorage untuk persistensi
 */
export const useWorkspaceActivity = () => {
  const [lastEdit, setLastEdit] = useState<WorkspaceActivity>({
    timestamp: null,
    userName: undefined,
  });

  // Load dari localStorage saat mount
  useEffect(() => {
    const stored = localStorage.getItem('workspaceLastEdit');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLastEdit({
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : null,
          userName: parsed.userName,
        });
      } catch (err) {
        console.error('Failed to parse workspace activity:', err);
      }
    }
  }, []);

  // Fungsi untuk update last edit
  const updateLastEdit = useCallback((userName?: string) => {
    const newActivity: WorkspaceActivity = {
      timestamp: new Date(),
      userName,
    };

    setLastEdit(newActivity);

    // Simpan ke localStorage
    localStorage.setItem('workspaceLastEdit', JSON.stringify({
      timestamp: newActivity.timestamp?.toISOString(),
      userName: newActivity.userName,
    }));
  }, []);

  return {
    lastEdit,
    updateLastEdit,
  };
};