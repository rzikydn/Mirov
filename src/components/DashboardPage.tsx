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

const API_URL = `${import.meta.env.VITE_API_URL}/api/databases`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(menuItems[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  // 🧩 Ambil data user dari localStorage
  const [user, setUser] = useState<{ name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null>(null);

  // ✅ Cek login state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 Dashboard - Checking auth:', { token: !!token, storedUser });

    if (!token || !storedUser) {
      // Belum login → kembali ke halaman auth
      console.log('❌ No token/user, redirecting to /auth');
      navigate('/auth');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ User loaded:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user:', error);
        navigate('/auth');
      }
    }
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
            { id: `row-2-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
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

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDatabases((prev) => prev.filter((db) => db.id !== id && db.id !== parseInt(id)));
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
        user={user}
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