import { useState, useEffect } from 'react';
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

const API_URL = `${import.meta.env.VITE_API_URL}/api/databases`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addHistory } = useHistory();
  const [databases, setDatabases] = useState<Database[]>([]);
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
      // Belum login → kembali ke halaman auth
      navigate('/auth', { replace: true });
    }

    // Listen for popstate (browser back/forward) and recheck auth
    const handlePopState = () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        navigate('/auth', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // 🧱 Fetch databases from backend
  useEffect(() => {
    const fetchDatabases = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDatabases(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

  const handleCreateDatabase = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const colKey = `title-${Date.now()}`;
    const nextNumber = databases.length + 1;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `New database ${nextNumber}`,
          columns: [{ key: colKey, label: 'Name', type: 'text' }],
          rows: [
            { id: `row-1-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
            { id: `row-2-${Date.now() + 1}`, properties: { [colKey]: { value: '', type: 'text' } } },
            { id: `row-3-${Date.now() + 2}`, properties: { [colKey]: { value: '', type: 'text' } } },
            { id: `row-4-${Date.now() + 3}`, properties: { [colKey]: { value: '', type: 'text' } } },
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Add to history
          if (user) {
            await addHistory({
              userName: user.name,
              userRole: user.role,
              action: 'create',
              target: 'database',
              targetName: result.data.name,
              description: `${user.name} added a database`
            });
          }
          setDatabases((prev) => [...prev, result.data]);
          setSelectedDatabase(result.data.id.toString());
        }
      }
    } catch (error) {
      console.error('Error creating database:', error);
    }
  };

  const handleDeleteDatabase = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Find database name before deleting
    const dbToDelete = databases.find((db) => db.id.toString() === id);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Add to history
        if (user && dbToDelete) {
          await addHistory({
            userName: user.name,
            userRole: user.role,
            action: 'delete',
            target: 'database',
            targetName: dbToDelete.name,
            description: `${user.name} deleted a database`
          });
        }
        setDatabases((prev) => prev.filter((db) => db.id.toString() !== id));
        if (selectedDatabase === id) {
          setSelectedDatabase(null);
        }
      }
    } catch (error) {
      console.error('Error deleting database:', error);
    }
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