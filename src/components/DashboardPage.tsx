import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './dashboards/Sidebar';
import Header from './dashboards/Header';
import DatabaseTable from './dashboards/DatabaseTable';
import TeamNotes from './dashboards/TeamNotes';
import { Database } from '../types/database';
import { menuItems } from '../constants/dashboard';
import { useDarkMode } from '../hooks/useDarkMode';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(menuItems[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  // 🧩 Ambil data user dari localStorage
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);

  // ✅ Cek login state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      // Belum login → kembali ke halaman auth
      navigate('/auth');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // 🧱 Initialize one default database (contoh demo)
  useEffect(() => {
    if (databases.length === 0) {
      const k = `title-${Date.now()}`;
      setDatabases([
        {
          id: `db-${Date.now()}`,
          name: 'New database 1',
          columns: [{ key: k, label: 'Name', type: 'text' }],
          rows: [
            { 
              id: `row-1-${Date.now()}`, 
              properties: { [k]: { value: 'Example row 1', type: 'text' } } 
            },
            { 
              id: `row-2-${Date.now()}`, 
              properties: { [k]: { value: 'Example row 2', type: 'text' } } 
            },
          ],
        },
      ]);
    }
  }, [databases.length]);

  const handleCreateDatabase = () => {
    const colKey = `title-${Date.now()}`;
    const nextNumber = databases.length + 1;
    const newDb: Database = {
      id: `db-${Date.now()}`,
      name: `New database ${nextNumber}`,
      columns: [{ key: colKey, label: 'Name', type: 'text' }],
      rows: [
        { id: `row-1-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
        { id: `row-2-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
      ],
    };
    setDatabases((prev) => [...prev, newDb]);
    setSelectedDatabase(newDb.id);
  };

  const handleDeleteDatabase = (id: string) => {
    setDatabases((prev) => prev.filter((db) => db.id !== id));
    if (selectedDatabase === id) {
      setSelectedDatabase(null);
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const currentDb = databases.find((d) => d.id === selectedDatabase) || null;

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
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} darkMode={darkMode} />

        <main className={`flex-1 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-slate-100'}`}>
          <AnimatePresence mode="wait">
            {!selectedDatabase ? (
              <TeamNotes key="notes" darkMode={darkMode} />
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