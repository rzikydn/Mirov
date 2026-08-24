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
  Bell,
  MoreVertical,
  Code,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Database } from '../../types/database';
import { menuItems } from '../../constants/dashboard';
import DeleteModal from './modals/DeleteModal';
import LogoutModal from './modals/LogoutModal';
import AvatarPickerModal from './modals/AvatarPickerModal';
import ApiIntegrationModal from './modals/ApiIntegrationModal';
import SettingPromptDialog from './modals/SettingPromptDialog';
import InstallationDialog from './modals/InstallationDialog';
import InputFaqModal from './modals/InputFaqModal';
import BsmrLogo from '../BsmrLogo';
import { useHistory } from '../../context/HistoryContext';
import { getVisitorChatSessions, getUnreadVisitorChatSessionsCount, fetchVisitorChatSessionsAsync } from '../../services/visitorChatLogsService';
import { NotificationList, getActiveNotificationCount } from '../animate-ui/components/community/notification-list';
import { BotIcon } from '../ui/BotIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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
  onRefreshParentData?: () => void;
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
  onRefreshParentData,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showFeatureUpdates, setShowFeatureUpdates] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSettingPromptDialog, setShowSettingPromptDialog] = useState(false);
  const [showInstallationDialog, setShowInstallationDialog] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  
  // User Avatar state synchronized with user record and event listener
  const [userAvatar, setUserAvatar] = useState<string>('');

  const syncUserAvatar = React.useCallback(() => {
    const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';
    const storedUserStr = localStorage.getItem('user');
    const storedUser = storedUserStr ? JSON.parse(storedUserStr) : user;
    if (!storedUser) {
      setUserAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=b6e3f4${safeParams}`);
      return;
    }
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedUser.name || 'User'}&backgroundColor=b6e3f4${safeParams}`;
    setUserAvatar(storedUser.avatar || defaultAvatar);
  }, [user]);

  React.useEffect(() => {
    syncUserAvatar();
    window.addEventListener('userAvatarUpdated', syncUserAvatar);
    return () => {
      window.removeEventListener('userAvatarUpdated', syncUserAvatar);
    };
  }, [syncUserAvatar]);

  // Track chat logs count in real-time to show notification number badge on AI Chatbot sidebar button (like History button)
  const [chatLogsCount, setChatLogsCount] = useState<number>(() => {
    const sessions = getVisitorChatSessions();
    return Array.isArray(sessions) ? sessions.length : 0;
  });
  const [hasUnreadChats, setHasUnreadChats] = useState<boolean>(() => {
    const sessions = getVisitorChatSessions();
    return Array.isArray(sessions) ? sessions.some((s) => s && s.isUnread !== false) : false;
  });

  React.useEffect(() => {
    const syncLogsCount = async () => {
      try {
        const fresh = await fetchVisitorChatSessionsAsync();
        if (Array.isArray(fresh)) {
          setChatLogsCount(fresh.length);
          setHasUnreadChats(fresh.some((s) => s && s.isUnread !== false));
          return;
        }
      } catch (e) {}
      const current = getVisitorChatSessions();
      if (Array.isArray(current)) {
        setChatLogsCount(current.length);
        setHasUnreadChats(current.some((s) => s && s.isUnread !== false));
      }
    };

    syncLogsCount();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'BSMR_CHAT_LOGS_UPDATED' || event.data.type === 'BSMR_ADMIN_REPLIED' || event.data.type === 'BSMR_CHAT_LOGS_UPDATED_BROADCAST')) {
        syncLogsCount();
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('bsmr_chat_sync_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'CHAT_LOGS_UPDATED' || event.data?.type === 'BSMR_CHAT_LOGS_UPDATED') {
            syncLogsCount();
          }
        };
      } catch (e) {}
    }

    window.addEventListener('bsmr_chat_logs_updated', syncLogsCount);
    window.addEventListener('bsmr_visitor_chat_sessions_updated', syncLogsCount);
    window.addEventListener('storage', syncLogsCount);
    window.addEventListener('message', handleMessage);

    // Polling fallback every 1.5 seconds so even when Admin is on any other page, new visitor chats instantly update the badge!
    const interval = setInterval(syncLogsCount, 1500);

    return () => {
      window.removeEventListener('bsmr_chat_logs_updated', syncLogsCount);
      window.removeEventListener('bsmr_visitor_chat_sessions_updated', syncLogsCount);
      window.removeEventListener('storage', syncLogsCount);
      window.removeEventListener('message', handleMessage);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);

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
              willChange: 'width',
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
                    className={`w-full ${collapsed ? 'flex justify-center' : 'text-left'} px-1.5 py-1.5 rounded-lg transition-colors duration-150 text-sm ${
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

                {/* Tombol AI Chatbot Ke-2 (Top Navigation List) */}
                {user && user.role !== 'UMUM' && (
                  <button
                    onClick={() => {
                      onSelectMenu('chatbot-top');
                      onSelectDatabase(null);
                      setIsOpen(false);
                    }}
                    className={`w-full ${collapsed ? 'flex justify-center' : 'flex items-center justify-between text-left'} px-1.5 py-1.5 rounded-lg transition-colors duration-150 text-sm ${
                      selectedMenu === 'chatbot-top' && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                    title={collapsed ? 'AI Chatbot' : undefined}
                  >
                    {collapsed ? (
                      <div className="relative flex items-center justify-center shrink-0">
                        <BotIcon size={20} className="w-[20px] h-[20px] text-current" />
                        {chatLogsCount > 0 && (
                          <span className={`absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold ring-2 ${
                            darkMode
                              ? 'bg-blue-600 text-white ring-gray-800'
                              : 'bg-blue-600 text-white ring-white'
                          }`}>
                            {chatLogsCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="whitespace-nowrap flex items-center gap-2 min-w-0">
                          <div className="relative flex items-center justify-center shrink-0">
                            <BotIcon size={20} className="w-[20px] h-[20px] text-current shrink-0" />
                            {hasUnreadChats && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse ring-2 ring-white dark:ring-gray-800" />
                            )}
                          </div>
                          <span className="overflow-hidden font-medium">AI Chatbot</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {chatLogsCount > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {chatLogsCount}
                            </span>
                          )}
                          {user && (user.role === 'SUPERUSER' || user.name?.toLowerCase().includes('superuser')) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-1 rounded hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors shrink-0 flex items-center justify-center text-current cursor-pointer"
                                title="Chatbot Options"
                              >
                                <MoreVertical className="w-4 h-4 opacity-80 hover:opacity-100" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-52" side="right" align="start" sideOffset={8}>
                              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                <BotIcon size={16} />
                                Chatbot Options
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettingPromptDialog(true);
                                  }}
                                  className="cursor-pointer font-medium"
                                >
                                  <Settings className="w-4 h-4 mr-2 text-blue-500" />
                                  Setting & Prompt
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFaqModal(true);
                                  }}
                                  className="cursor-pointer font-medium"
                                >
                                  <HelpCircle className="w-4 h-4 mr-2 text-violet-500" />
                                  Manajemen FAQ
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInstallationDialog(true);
                                  }}
                                  className="cursor-pointer font-medium"
                                >
                                  <Code className="w-4 h-4 mr-2 text-emerald-500" />
                                  Installation
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowApiModal(true);
                                  }}
                                  className="cursor-pointer font-medium"
                                >
                                  <Cpu className="w-4 h-4 mr-2 text-amber-500" />
                                  API Integration
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        </div>
                      </>
                    )}
                  </button>
                )}
              </nav>

              <div className="mb-3 flex-1">
                {!collapsed ? (
                  <>
                    <div className="flex items-center justify-between mb-3 mt-2 px-0.5">
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
                          className={`w-full text-left px-1.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 group text-sm ${
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
                  <div className={`${collapsed ? 'flex justify-center' : 'px-1.5'} py-2 mb-1 rounded-lg transition-colors relative group ${
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
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-1.5'} px-1.5 py-1.5 rounded-lg transition-colors text-sm ${
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
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                        {collapsed && history.length > 0 && (
                          <span className={`absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold ring-2 ${
                            darkMode
                              ? 'bg-blue-600 text-white ring-gray-800'
                              : 'bg-blue-600 text-white ring-white'
                          }`}>
                            {history.length}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="font-medium truncate text-xs sm:text-sm">History</span>
                      )}
                    </div>
                    {!collapsed && history.length > 0 && (
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                        darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {history.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Feature Updates Button with Floating NotificationList Popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowFeatureUpdates(!showFeatureUpdates)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-1.5'} px-1.5 py-1.5 rounded-lg transition-colors text-sm ${
                      showFeatureUpdates
                        ? darkMode
                          ? 'bg-blue-900/50 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={collapsed ? 'Feature updates' : undefined}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                      {!collapsed && (
                        <span className="font-medium truncate text-xs sm:text-sm">Feature updates</span>
                      )}
                    </div>
                    {!collapsed && (
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                        darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getActiveNotificationCount()}
                      </span>
                    )}
                  </button>

                  {/* Floating Popover Overlay (Ultra-lightweight dim backdrop with 0 GPU blur pass overhead) */}
                  {showFeatureUpdates && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 transition-opacity duration-150 animate-in fade-in"
                        onClick={() => setShowFeatureUpdates(false)}
                      />
                      <div className={`fixed left-4 right-4 sm:right-auto ${collapsed ? 'sm:left-[76px]' : 'sm:left-[200px]'} bottom-16 z-50 sm:w-80 transform-gpu will-change-transform animate-in fade-in zoom-in-95 duration-150 shadow-2xl rounded-3xl overflow-hidden border ${
                        darkMode ? 'bg-[#18181b] border-gray-800' : 'bg-white border-gray-200'
                      }`}>
                        <NotificationList darkMode={darkMode} className="w-full border-none shadow-none" />
                      </div>
                    </>
                  )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={(e) => toggleDarkMode(e)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-1.5'} px-1.5 py-1.5 rounded-lg transition-colors text-sm ${
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
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex items-center justify-center shrink-0">
                          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </div>
                        <span className="font-medium truncate text-xs sm:text-sm">
                          {darkMode ? 'Light' : 'Dark'}
                        </span>
                      </div>
                      <div
                        className={`w-8 h-5 rounded-full transition-colors ${
                          darkMode ? 'bg-blue-600' : 'bg-gray-300'
                        } relative shrink-0`}
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
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-1.5'} px-1.5 py-1.5 rounded-lg transition-colors text-sm ${
                    darkMode
                      ? 'text-gray-300 hover:bg-red-900 hover:text-red-300'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                  title={collapsed ? 'Logout' : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    {!collapsed && (
                      <span className="font-medium truncate text-xs sm:text-sm">Logout</span>
                    )}
                  </div>
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
        onSelect={(newAvatar) => {
          setUserAvatar(newAvatar);
        }}
        onClose={() => setShowAvatarPicker(false)}
      />

      {/* API Integration Modal */}
      <ApiIntegrationModal
        show={showApiModal}
        darkMode={darkMode}
        onClose={() => setShowApiModal(false)}
      />

      {/* Setting & Prompt Dialog */}
      <SettingPromptDialog
        show={showSettingPromptDialog}
        darkMode={darkMode}
        onClose={() => setShowSettingPromptDialog(false)}
      />

      {/* Installation Dialog */}
      <InstallationDialog
        show={showInstallationDialog}
        darkMode={darkMode}
        onClose={() => setShowInstallationDialog(false)}
      />

      {/* FAQ Management Dialog */}
      <InputFaqModal
        show={showFaqModal}
        darkMode={darkMode}
        onClose={() => setShowFaqModal(false)}
      />
    </>
  );
};

export default Sidebar;