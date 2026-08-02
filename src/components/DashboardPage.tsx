import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './dashboards/Sidebar';
import Header from './dashboards/Header';
import DatabaseTable from './dashboards/DatabaseTable';
import TeamNotes from './dashboards/TeamNotes';
import HistoryPage from './dashboards/HistoryPage';

import { Database } from '../types/database';
import { menuItems } from '../constants/dashboard';
import { useDarkMode } from '../hooks/useDarkMode';
import { useHistory } from '../context/HistoryContext';
import { apiFetch, getCache, setCache } from '../services/offlineSync';

const API_URL = `${import.meta.env.VITE_API_URL}/api/databases`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addHistory } = useHistory();
  const [databases, setDatabases] = useState<Database[]>(() => getCache<Database[]>('databases', []));
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(menuItems[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Track desktop vs mobile for sidebar margin
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync databases state with localStorage cache whenever databases change
  useEffect(() => {
    if (databases.length > 0) {
      setCache('databases', databases);
    }
  }, [databases]);

  // 🧩 Ambil data user dari localStorage secara sinkron saat inisialisasi state
  const [user] = useState<{ name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('❌ Error parsing initial user state:', error);
        return null;
      }
    }
    return null;
  });

  // ✅ Cek login state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/auth', { replace: true });
    }

    const handlePopState = () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        navigate('/auth', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // 🧱 Fetch databases from backend with offline fallback & sync event listener
  const fetchDatabases = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { ok, data } = await apiFetch<{ success?: boolean; data?: Database[] }>(API_URL, {}, 'databases');
    if (ok && data && data.data) {
      setDatabases(data.data);
      setCache('databases', data.data);
    }
  }, []);

  useEffect(() => {
    fetchDatabases();

    // Re-fetch databases when offline queue is synced
    const handleDataSynced = () => {
      fetchDatabases();
    };

    window.addEventListener('app:data-synced', handleDataSynced);
    return () => window.removeEventListener('app:data-synced', handleDataSynced);
  }, [fetchDatabases]);

  const handleCreateDatabase = async () => {
    const colKey = `title-${Date.now()}`;
    const nextNumber = databases.length + 1;
    const tempId = Date.now();

    const payload = {
      name: `New database ${nextNumber}`,
      columns: [{ key: colKey, label: 'Name', type: 'text' }],
      rows: [
        { id: `row-1-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
        { id: `row-2-${Date.now() + 1}`, properties: { [colKey]: { value: '', type: 'text' } } },
        { id: `row-3-${Date.now() + 2}`, properties: { [colKey]: { value: '', type: 'text' } } },
        { id: `row-4-${Date.now() + 3}`, properties: { [colKey]: { value: '', type: 'text' } } },
      ]
    };

    // Optimistic UI Update
    const newDbLocal: Database = {
      id: tempId,
      name: payload.name,
      columns: payload.columns,
      rows: payload.rows as any,
    };

    setDatabases((prev) => {
      const updated = [...prev, newDbLocal];
      setCache('databases', updated);
      return updated;
    });
    setSelectedDatabase(tempId.toString());

    if (user) {
      addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'create',
        target: 'database',
        targetName: payload.name,
        description: `${user.name} added a database`
      });
    }

    const { ok, data } = await apiFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (ok && data && data.data && data.data.id) {
      // Server returned real ID -> update local database ID
      const realDb = data.data;
      setDatabases((prev) => prev.map((db) => (db.id === tempId ? realDb : db)));
      setSelectedDatabase(realDb.id.toString());
    }
  };

  const handleDeleteDatabase = async (id: string) => {
    const dbToDelete = databases.find((db) => db.id.toString() === id);

    // Optimistic UI Update
    setDatabases((prev) => {
      const updated = prev.filter((db) => db.id.toString() !== id);
      setCache('databases', updated);
      return updated;
    });

    if (selectedDatabase === id) {
      setSelectedDatabase(null);
    }

    if (user && dbToDelete) {
      addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'delete',
        target: 'database',
        targetName: dbToDelete.name,
        description: `${user.name} deleted a database`
      });
    }

    await apiFetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const currentDb = databases.find((d) => d.id.toString() === selectedDatabase) || null;

  return (
    <div className={`flex h-screen relative overflow-hidden ${darkMode ? 'bg-gray-900' : ''}`}>

      <Sidebar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onCreateDatabase={handleCreateDatabase}
        onDeleteDatabase={handleDeleteDatabase}
        selectedMenu={selectedMenu}
        onSelectMenu={setSelectedMenu}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        user={user}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onRefreshParentData={fetchDatabases}
      />

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          marginLeft: isDesktop ? (isCollapsed ? 72 : 192) : 0,
          transition: 'margin-left 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'margin-left',
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} darkMode={darkMode} user={user} />

        <main className={`flex-1 relative overflow-y-auto hide-scrollbar ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <AnimatePresence mode="wait">
            {!selectedDatabase ? (
              selectedMenu === '1' ? (
                <TeamNotes key="notes" darkMode={darkMode} />
              ) : selectedMenu === 'history' ? (
                <HistoryPage key="history" darkMode={darkMode} />
              ) : null
            ) : currentDb ? (
              <DatabaseTable
                key={currentDb.id}
                database={currentDb}
                setDatabases={setDatabases}
                darkMode={darkMode}
              />
            ) : (
              <motion.div key="empty" className="p-6">
                <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Selected database not found.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}