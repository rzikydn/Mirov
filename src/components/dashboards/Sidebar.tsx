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
} from 'lucide-react';
import { Database } from '../../types/database';
import { menuItems } from '../../constants/dashboard';
import DeleteModal from './modals/DeleteModal';
import LogoutModal from './modals/LogoutModal';

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
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25 }}
            className={`fixed lg:static z-40 top-0 left-0 w-64 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-r h-full flex flex-col ${isOpen ? 'shadow-xl' : ''}`}
          >
            <div className="p-5 flex flex-col flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      My Workspace
                    </div>
                  </div>
                </div>
                <button
                  className={`lg:hidden p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
              </div>

              <nav className="space-y-2 mb-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectMenu(item.id);
                      onSelectDatabase(null);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                      selectedMenu === item.id && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>

              <div className="mb-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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

                <div className="space-y-2">
                  {databases.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => {
                        onSelectDatabase(db.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 group ${
                        selectedDatabase === db.id
                          ? darkMode
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-blue-50 text-[#2563eb]'
                          : darkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3" />
                      <span className="truncate flex-1">{db.name}</span>
                      <button
                        onClick={(e) => handleDeleteClick(e, db.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                        title="Delete database"
                        aria-label={`Delete ${db.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-3 space-y-2`}>
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-red-900 hover:text-red-300'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
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
    </>
  );
};

export default Sidebar;