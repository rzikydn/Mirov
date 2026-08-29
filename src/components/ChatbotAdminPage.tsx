import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './dashboards/Sidebar';
import Header from './dashboards/Header';
import ChatbotDashboard from './dashboards/ChatbotDashboard';
import { useDarkMode } from '../hooks/useDarkMode';
import { Database } from '../types/database';

export default function ChatbotAdminPage() {
  const navigate = useNavigate();
  const [databases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>('chatbot');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { darkMode, toggleDarkMode } = useDarkMode();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [user] = useState<{ name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user state:', error);
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className={`flex h-screen relative overflow-hidden ${darkMode ? 'bg-gray-900' : ''}`}>
      <Sidebar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onCreateDatabase={() => {}}
        onDeleteDatabase={() => {}}
        selectedMenu={selectedMenu}
        onSelectMenu={(menuId) => {
          setSelectedMenu(menuId);
          if (menuId !== 'chatbot') {
            navigate('/dashboard');
          }
        }}
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
          <ChatbotDashboard darkMode={darkMode} />
        </main>
      </div>
    </div>
  );
}
