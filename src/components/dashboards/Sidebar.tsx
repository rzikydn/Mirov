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
  User,
  Clock,
  Menu,
  StickyNote,
  Database as DatabaseIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Database } from '../../types/database';
import { menuItems } from '../../constants/dashboard';
import DeleteModal from './modals/DeleteModal';
import LogoutModal from './modals/LogoutModal';
import HistoryModal from './modals/HistoryModal';
import { useHistory } from '../../context/HistoryContext';
import BsmrLogo from '../BsmrLogo';

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
  toggleDarkMode: () => void;
  user?: { name: string; email: string; role: 'SUPERUSER' | 'ADMIN' | 'UMUM' } | null;
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
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed on desktop
  const { history } = useHistory();

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
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{
              x: 0,
              width: isCollapsed && window.innerWidth >= 1024 ? '72px' : '192px'
            }}
            exit={{ x: -320 }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            className={`fixed lg:static z-40 top-0 left-0 lg:inset-auto ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-r flex flex-col ${isOpen ? 'shadow-xl' : ''}`}
            style={{
              height: window.innerWidth < 1024 ? '100svh' : 'auto',
              maxHeight: window.innerWidth < 1024 ? '100svh' : 'none',
              bottom: window.innerWidth < 1024 ? 0 : 'auto',
              willChange: 'transform, width',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <div className="p-3 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
              <div className={`flex items-center mb-6 ${isCollapsed && window.innerWidth >= 1024 ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-3 ${isCollapsed && window.innerWidth >= 1024 ? 'flex-col' : 'flex-1'}`}>
                  {/* BSMR Logo */}
                  <BsmrLogo
                    collapsed={isCollapsed && window.innerWidth >= 1024}
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
                    className={`w-full ${isCollapsed && window.innerWidth >= 1024 ? 'flex justify-center' : 'text-left'} px-2 py-1.5 rounded-lg transition-colors duration-150 text-sm ${
                      selectedMenu === item.id && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                    title={isCollapsed && window.innerWidth >= 1024 ? item.name : undefined}
                  >
                    {isCollapsed && window.innerWidth >= 1024 ? (
                      item.id === '1' ? <StickyNote className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />
                    ) : (
                      item.name
                    )}
                  </button>
                ))}
              </nav>

              <div className="mb-3 flex-1">
                {!(isCollapsed && window.innerWidth >= 1024) ? (
                  <>
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                            selectedDatabase === db.id
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
                              onSelectDatabase(db.id);
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
                                handleDeleteClick(e, db.id);
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
                          onSelectDatabase(db.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex justify-center p-2 rounded-lg transition-colors relative ${
                          selectedDatabase === db.id
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
                  <div className={`${isCollapsed && window.innerWidth >= 1024 ? 'flex justify-center' : 'px-2'} py-2 mb-1 rounded-lg ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                  }`}>
                    {isCollapsed && window.innerWidth >= 1024 ? (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}
                        title={`${user.name} - ${user.role === 'SUPERUSER' ? 'Superuser' : user.role === 'ADMIN' ? 'Admin' : 'Umum'}`}
                      >
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          darkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <User className="w-4 h-4 text-white" />
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
                    onClick={() => setShowHistory(true)}
                    className={`w-full flex items-center ${isCollapsed && window.innerWidth >= 1024 ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={isCollapsed && window.innerWidth >= 1024 ? 'History' : undefined}
                  >
                    <Clock className="w-4 h-4" />
                    {!(isCollapsed && window.innerWidth >= 1024) && (
                      <>
                        <span className="font-medium">History</span>
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
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center ${isCollapsed && window.innerWidth >= 1024 ? 'justify-center' : 'justify-between'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed && window.innerWidth >= 1024 ? (darkMode ? 'Light mode' : 'Dark mode') : undefined}
                >
                  {isCollapsed && window.innerWidth >= 1024 ? (
                    darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {darkMode ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                        <span className="font-medium">
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
                  className={`w-full flex items-center ${isCollapsed && window.innerWidth >= 1024 ? 'justify-center' : 'gap-2'} px-2 py-1.5 rounded-lg transition-colors text-sm ${
                    darkMode
                      ? 'text-gray-300 hover:bg-red-900 hover:text-red-300'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                  title={isCollapsed && window.innerWidth >= 1024 ? 'Logout' : undefined}
                >
                  <Home className="w-4 h-4" />
                  {!(isCollapsed && window.innerWidth >= 1024) && <span className="font-medium">Logout</span>}
                </button>
              </div>
            </div>
          </motion.aside>
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

      {/* History Modal */}
      <HistoryModal
        show={showHistory}
        darkMode={darkMode}
        history={history}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
};

export default Sidebar;