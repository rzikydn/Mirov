// src/components/dashboards/Sidebar.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronRight,
  Home,
  X,
  Trash2,
  Moon,
  Sun,
  Clock,
  Menu,
  StickyNote,
  Database as DatabaseIcon,
  Calendar as CalendarIcon,
  Settings,
} from 'lucide-react';
import { Database } from '../../types/database';
import { menuItems } from '../../constants/dashboard';
import DeleteModal from './modals/DeleteModal';
import LogoutModal from './modals/LogoutModal';
import AvatarPickerModal from './modals/AvatarPickerModal';
import BsmrLogo from '../BsmrLogo';
import { useHistory } from '../../context/HistoryContext';

interface SidebarProps {
  databases: Database[];
  selectedDatabase: string | null;
  onSelectDatabase: (id: string | null) => void;
  onCreateDatabase: () => void;
  onDeleteDatabase: (id: string) => void;
  selectedMenu: string | null;
  onSelectMenu: (id: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: (e?: React.MouseEvent) => void;
  user?: { name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onCreateDatabase,
  onDeleteDatabase,
  selectedMenu,
  onSelectMenu,
  onLogout,
  isOpen,
  setIsOpen,
  darkMode,
  toggleDarkMode,
  user,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Persist avatar selection in localStorage simulating a backend
  // React state initialization only runs once. So we must use useEffect below to catch user changes mapping.
  const [userAvatar, setUserAvatar] = useState<string>('');

  // Re-fetch avatar when user logs in/changes
  React.useEffect(() => {
    const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';
    if (!user) {
      setUserAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=b6e3f4${safeParams}`);
      return;
    }
    
    const userKey = user.name || user.email || 'User';
    // Get personal choice
    const personalSaved = localStorage.getItem(`user_avatar_${userKey}`);
    
    // Manage Global Map
    const globalMapStr = localStorage.getItem('global_used_avatars');
    const globalMap = globalMapStr ? JSON.parse(globalMapStr) : {};
    
    const activeAvatar = personalSaved || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userKey}&backgroundColor=b6e3f4${safeParams}`;
    
    // Ensure it's in the global map for this user
    if (globalMap[userKey] !== activeAvatar) {
      globalMap[userKey] = activeAvatar;
      localStorage.setItem('global_used_avatars', JSON.stringify(globalMap));
    }
    
    setUserAvatar(activeAvatar);
  }, [user]);

  // Calculate disabled avatars just in time for the modal
  const getDisabledAvatars = () => {
    if (!user) return [];
    const userKey = user.name || user.email || 'User';
    const globalMapStr = localStorage.getItem('global_used_avatars');
    const globalMap = globalMapStr ? JSON.parse(globalMapStr) : {};
    
    // Return all values from global map EXCEPT this user's avatar
    return Object.entries(globalMap)
      .filter(([key, _]) => key !== userKey)
      .map(([_, url]) => url as string);
  };

  const { history } = useHistory();

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const collapsed = isCollapsed && isDesktop;

  const handleDeleteClick = (e: React.MouseEvent, dbId: string) => {
    e.stopPropagation();
    setDeleteDbId(dbId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteDbId) {
      onDeleteDatabase(deleteDbId);
      setShowDeleteConfirm(false);
      setDeleteDbId(null);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <AnimatePresence>
        {(isOpen || isDesktop) && (
          <motion.aside
            initial={isDesktop ? false : { x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{
              duration: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`fixed z-40 top-0 left-0 bottom-0 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-r flex flex-col ${isOpen && !isDesktop ? 'shadow-xl' : ''}`}
            style={{
              width: collapsed ? 72 : 192,
              transition: 'width 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            <div className="p-3 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
              <div className={`flex items-center mb-6 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : 'flex-1'}`}>
                  {/* BSMR Logo */}
                  <BsmrLogo
                    collapsed={collapsed}
                    darkMode={darkMode}
                  />

                  {/* Toggle button - Desktop only */}
                  <button
                    className={`hidden lg:block p-1.5 rounded transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    <Menu className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                </div>

                {/* Close button - Mobile only */}
                <button
                  className={`lg:hidden p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
              </div>

              <nav className="space-y-1 mb-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectMenu(item.id);
                      onSelectDatabase(null);
                      setIsOpen(false);
                    }}
                    className={`w-full ${collapsed ? 'flex justify-center' : 'text-left'} px-2 py-1.5 rounded-lg transition-colors duration-150 text-sm ${
                      selectedMenu === item.id && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {collapsed ? (
                      item.id === '1' ? <StickyNote className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />
                    ) : (
                      <span className="whitespace-nowrap flex items-center gap-2">
                        {item.id === '1' ? <StickyNote className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                        <span className="overflow-hidden">{item.name}</span>
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mb-3 flex-1">
                {!collapsed ? (
                  <>
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <span className={`text-sm font-semibold whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Databases
                      </span>
                      <button
                        onClick={onCreateDatabase}
                        className={`p-1 rounded transition-colors ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title="New Database"
                        aria-label="Create database"
                      >
                        <Plus className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {databases.map((db) => (
                        <div
                          key={db.id}
                          className={`w-full text-left px-2 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 group text-sm ${
                            selectedDatabase === db.id.toString()
                              ? darkMode
                                ? 'bg-blue-900 text-blue-300'
                                : 'bg-blue-50 text-[#2563eb]'
                              : darkMode
                                ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectDatabase(db.id.toString());
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-2 flex-1 min-w-0"
                          >
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{db.name}</span>
                          </button>
                          {/* Delete button - Only for SUPERUSER */}
                          {user?.role === 'SUPERUSER' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(e, db.id.toString());
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity flex-shrink-0"
                              title="Delete database (SUPERUSER only)"
                              aria-label={`Delete ${db.name}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Collapsed view - show Database icon with badge count
                  <div className="space-y-2">
                    <button
                      onClick={onCreateDatabase}
                      className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="New Database"
                      aria-label="Create database"
                    >
                      <Plus className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>

                    {databases.map((db) => (
                      <button
                        key={db.id}
                        onClick={() => {
                          onSelectDatabase(db.id.toString());
                          setIsOpen(false);
                        }}
                        className={`w-full flex justify-center p-2 rounded-lg transition-colors relative ${
                          selectedDatabase === db.id.toString()
                            ? darkMode
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-blue-50 text-[#2563eb]'
                            : darkMode
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                        }`}
                        title={db.name}
                      >
                        <DatabaseIcon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-2 space-y-1`}>
                {/* User Profile Display */}
                {user && (
                  <div className={`${collapsed ? 'flex justify-center' : 'px-2'} py-2 mb-1 rounded-lg transition-colors relative group ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                  }`}>
                    {collapsed ? (
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                            darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                          }`}
                          title={`${user.name} - ${user.role === 'SUPERUSER' ? 'Superuser' : user.role === 'ADMIN' ? 'Admin' : 'Umum'}`}
                        >
                          <img src={userAvatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={() => setShowAvatarPicker(true)}
                          className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 ${
                            darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                          }`}>
                            <img src={userAvatar} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => setShowAvatarPicker(true)}
                            className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-sm cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 ${
                              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                            title="Tukar Avatar"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user.name}
                          </p>
                          <p className={`text-[10px] truncate ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {user.role === 'SUPERUSER' ? 'Superuser' : user.role === 'ADMIN' ? 'Admin' : 'Umum'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* History Button - Only for ADMIN and SUPERUSER */}
                {user && user.role !== 'UMUM' && (
                  <button
                    onClick={() => {
                      onSelectMenu('history');
                      onSelectDatabase(null);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                      selectedMenu === 'history' && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={collapsed ? 'History' : undefined}
                  >
                    <Clock className="w-4 h-4" />
                    {!collapsed && (
                      <>
                        <span className="font-medium whitespace-nowrap">History</span>
                        {history.length > 0 && (
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                            darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {history.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={(e) => toggleDarkMode(e)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={collapsed ? (darkMode ? 'Light mode' : 'Dark mode') : undefined}
                >
                  {collapsed ? (
                    darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {darkMode ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                        <span className="font-medium whitespace-nowrap">
                          {darkMode ? 'Light' : 'Dark'}
                        </span>
                      </div>
                      <div
                        className={`w-8 h-5 rounded-full transition-colors ${
                          darkMode ? 'bg-blue-600' : 'bg-gray-300'
                        } relative`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            darkMode ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </>
                  )}
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                    darkMode
                      ? 'text-gray-300 hover:bg-red-900 hover:text-red-300'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                  title={collapsed ? 'Logout' : undefined}
                >
                  <Home className="w-4 h-4" />
                  {!collapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Database Modal */}
      <DeleteModal
        show={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete Database"
        message="Are you sure you want to delete this database? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Logout Modal */}
      <LogoutModal
        show={showLogoutConfirm}
        darkMode={darkMode}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        show={showAvatarPicker}
        darkMode={darkMode}
        currentAvatar={userAvatar}
        disabledAvatars={getDisabledAvatars()}
        onSelect={(newAvatar) => {
          if (!user) return;
          const userKey = user.name || user.email || 'User';
          
          setUserAvatar(newAvatar);
          // Save personal
          localStorage.setItem(`user_avatar_${userKey}`, newAvatar);
          // Update global
          const globalMapStr = localStorage.getItem('global_used_avatars');
          const globalMap = globalMapStr ? JSON.parse(globalMapStr) : {};
          globalMap[userKey] = newAvatar;
          localStorage.setItem('global_used_avatars', JSON.stringify(globalMap));
        }}
        onClose={() => setShowAvatarPicker(false)}
      />
    </>
  );
};

export default Sidebar;