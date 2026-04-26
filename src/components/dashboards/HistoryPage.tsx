import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, FileText, Database as DatabaseIcon, Calendar, Trash2, Star, Search, ChevronUp, ChevronDown, X, CheckSquare, CalendarDays, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';
import { HistoryEntry, useHistory } from '../../context/HistoryContext';
import { useAuth } from '../../context/AuthContext';
import DeleteModal from './modals/DeleteModal';
import { ActivityGraph } from './ActivityGraph';

interface HistoryPageProps {
  darkMode: boolean;
}

// ── Constants ──
const ITEMS_PER_PAGE = 30;



const formatDateIDFull = (date: Date): string => {
  const h = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const b = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${h[date.getDay()]}, ${date.getDate()} ${b[date.getMonth()]} ${date.getFullYear()}`;
};

const formatTimeID = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} WIB`;
};

// ── Truncated Description Component ──
const TruncatedDescription = ({ text, darkMode }: { text: string; darkMode: boolean }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };
    checkTruncation();
    const observer = new ResizeObserver(() => checkTruncation());
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div className="flex items-center min-w-0 flex-1">
      <span 
        ref={textRef}
        className={`text-sm font-medium truncate block min-w-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
      >
        {text}
      </span>
      {isTruncated && (
        <div 
          className="relative ml-2 flex-shrink-0 inline-flex items-center"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className={`text-[11px] font-semibold cursor-pointer whitespace-nowrap bg-transparent hover:underline px-1 py-0.5 rounded-md transition-colors ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Lihat selengkapnya
          </button>
          
          <AnimatePresence>
            {showTooltip && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[99] bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[320px] whitespace-normal bg-white text-gray-900 text-xs font-semibold px-3 py-2 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 pointer-events-none text-left"
              >
                {text}
                <svg className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px] w-4 h-4 text-white" viewBox="0 0 16 8" fill="currentColor">
                  <path d="M8 8L0 0H16L8 8Z" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ── Action label & color ──
const getActionLabel = (action: string): string => {
  switch (action) {
    case 'create': return 'Created';
    case 'edit': return 'Updated';
    case 'delete': return 'Deleted';
    case 'added': return 'Added';
    default: return action;
  }
};

const getActionColor = (action: string, darkMode: boolean) => {
  switch (action) {
    case 'create': return darkMode ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-700 bg-emerald-50';
    case 'edit': return darkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-700 bg-blue-50';
    case 'delete': return darkMode ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-50';
    case 'added': return darkMode ? 'text-purple-400 bg-purple-900/30' : 'text-purple-700 bg-purple-50';
    default: return darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-100';
  }
};

const getIconForTarget = (entry: HistoryEntry) => {
  const isFav = entry.description.includes('added note to favorites');
  const isUnfav = entry.description.includes('removed note from favorites');
  if (isFav) return <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
  if (isUnfav) return <Star className="w-4 h-4 fill-red-400 text-red-400" />;
  switch (entry.target) {
    case 'note': return <FileText className="w-4 h-4" />;
    case 'database': return <DatabaseIcon className="w-4 h-4" />;
    case 'schedule': return <Calendar className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getIconBg = (entry: HistoryEntry, darkMode: boolean) => {
  const isFav = entry.description.includes('added note to favorites');
  const isUnfav = entry.description.includes('removed note from favorites');
  if (isFav) return darkMode ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-100 text-yellow-600';
  if (isUnfav) return darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600';
  switch (entry.action) {
    case 'create': return darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600';
    case 'edit': return darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600';
    case 'delete': return darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600';
    case 'added': return darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600';
    default: return darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600';
  }
};

// ══════════════════════════════════════════════
// ██ MAIN COMPONENT
// ══════════════════════════════════════════════
const HistoryPage: React.FC<HistoryPageProps> = ({ darkMode }) => {
  const { history, deleteHistory } = useHistory();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sortField, setSortField] = useState<'date' | 'user' | 'action' | 'target'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // New filter states
  const [actionFilter, setActionFilter] = useState<'all' | 'create' | 'edit' | 'delete'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const canDelete = user?.role === 'SUPERUSER';

  // ── FILTER & SORT ──
  const filteredHistory = useMemo(() => {
    let result = history.filter(entry => {
      const q = searchQuery.toLowerCase();
      const matchSearch = entry.description.toLowerCase().includes(q) ||
             entry.userName.toLowerCase().includes(q) ||
             (entry.targetName || '').toLowerCase().includes(q) ||
             entry.action.toLowerCase().includes(q);

      // Action type filter
      const matchAction = actionFilter === 'all' || entry.action === actionFilter;

      // Date filter
      let matchDate = true;
      if (dateFilter) {
        const entryDate = new Date(entry.createdAt);
        const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        matchDate = entryDateStr === dateFilter;
      }

      return matchSearch && matchAction && matchDate;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'user':
          cmp = a.userName.localeCompare(b.userName);
          break;
        case 'action':
          cmp = a.action.localeCompare(b.action);
          break;
        case 'target':
          cmp = (a.targetName || '').localeCompare(b.targetName || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [history, searchQuery, sortField, sortDir, actionFilter, dateFilter]);

  const visibleEntries = useMemo(() => filteredHistory.slice(0, visibleCount), [filteredHistory, visibleCount]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100) {
      if (visibleCount < filteredHistory.length) {
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredHistory.length));
      }
    }
  }, [visibleCount, filteredHistory.length]);

  const handleDeleteClick = useCallback((id: number, entryName: string) => {
    if (!canDelete) return;
    setEntryToDelete({ id, name: entryName });
    setShowDeleteConfirm(true);
  }, [canDelete]);

  const confirmDelete = useCallback(async () => {
    if (!entryToDelete) return;
    setShowDeleteConfirm(false);
    const loadingToast = toast.loading('Deleting activity...');
    const success = await deleteHistory(entryToDelete.id);
    toast.dismiss(loadingToast);
    if (success) toast.success('Activity deleted!');
    else toast.error('Failed to delete.');
    setEntryToDelete(null);
  }, [entryToDelete, deleteHistory]);

  // Bulk delete
  const confirmBulkDelete = useCallback(async () => {
    setBulkDeleteConfirm(false);
    const loadingToast = toast.loading(`Deleting ${selectedIds.size} activities...`);
    let successCount = 0;
    for (const id of selectedIds) {
      const success = await deleteHistory(id);
      if (success) successCount++;
    }
    toast.dismiss(loadingToast);
    if (successCount > 0) toast.success(`${successCount} activities deleted!`);
    else toast.error('Failed to delete.');
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, deleteHistory]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleEntries.map(e => e.id)));
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="inline-flex flex-col ml-1.5 -space-y-1">
      <ChevronUp className={`w-3 h-3 ${sortField === field && sortDir === 'asc' ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-600' : 'text-gray-300')}`} />
      <ChevronDown className={`w-3 h-3 ${sortField === field && sortDir === 'desc' ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-600' : 'text-gray-300')}`} />
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      onScroll={handleScroll}
    >
      <div className="px-4 sm:px-6 lg:px-12 pt-8 pb-12">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Activity Log</h1>
        </div>

        {/* ══ Kibo UI Contribution Graph ══ */}
        <ActivityGraph 
          history={history} 
          darkMode={darkMode} 
          onDateSelect={setDateFilter}
          selectedDate={dateFilter}
        />

        {/* ══ Activity Log Card Table ══ */}
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* ── Card Header ── */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            {/* Row 1: Title + Search + Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recent Activity
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  {filteredHistory.length}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className={`relative w-full sm:w-56 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                    className={`w-full pl-9 pr-9 py-2 text-sm rounded-lg border outline-none transition-colors
                      ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600'
                        : 'bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-400'
                      }
                    `}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setVisibleCount(ITEMS_PER_PAGE); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bulk Select Toggle */}
                {canDelete && (
                  <button
                    onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors
                      ${bulkMode
                        ? (darkMode ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-600')
                        : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                      }
                    `}
                    title="Bulk Select"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Select</span>
                  </button>
                )}

                {/* Date Filter */}
                <div className="relative group flex items-center">
                  <div className={`relative flex items-center pl-9 pr-8 py-2 text-sm rounded-lg border transition-colors cursor-pointer w-[210px]
                    ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-blue-500 hover:text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400'
                    }
                  `}>
                    <CalendarDays className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400'}`} />
                    <span className="truncate">
                      {dateFilter ? (
                        (() => {
                          const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                          const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                          const d = new Date(dateFilter + 'T00:00:00');
                          return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
                        })()
                      ) : 'Keterangan tanggal'}
                    </span>
                    
                    {/* Transparent native date input overlay */}
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-opacity z-10
                        ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Action Type Filter Tabs + Bulk Delete */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                {[
                  { key: 'all' as const, label: 'All Activity', icon: <ListFilter className="w-3.5 h-3.5" /> },
                  { key: 'create' as const, label: 'Created', icon: <span className="w-2 h-2 rounded-full bg-emerald-500" /> },
                  { key: 'edit' as const, label: 'Edited', icon: <span className="w-2 h-2 rounded-full bg-blue-500" /> },
                  { key: 'delete' as const, label: 'Deleted', icon: <span className="w-2 h-2 rounded-full bg-red-500" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActionFilter(tab.key); setVisibleCount(ITEMS_PER_PAGE); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                      ${actionFilter === tab.key
                        ? (darkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-gray-900 text-white shadow-sm')
                        : (darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                      }
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk Delete Button */}
              {bulkMode && selectedIds.size > 0 && (
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                    ${darkMode ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-600 hover:bg-red-100'}
                  `}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete {selectedIds.size} selected
                </button>
              )}
            </div>
          </div>

          {/* ── Table Header ── */}
          <div className={`hidden md:grid gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b
            ${darkMode ? 'text-gray-500 border-gray-700 bg-gray-800/50' : 'text-gray-400 border-gray-100 bg-gray-50/50'}
          `}
            style={{ gridTemplateColumns: bulkMode ? '40px 6fr 1.5fr 2fr 1.5fr 60px' : '6fr 1.5fr 2fr 1.5fr 60px' }}
          >
            {bulkMode && (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === visibleEntries.length && visibleEntries.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
              </div>
            )}
            <div className="flex items-center cursor-pointer select-none hover:text-gray-300 min-w-0" onClick={() => handleSort('action')}>
              Description <SortIcon field="action" />
            </div>
            <div className="flex items-center cursor-pointer select-none hover:text-gray-300 min-w-0" onClick={() => handleSort('user')}>
              User <SortIcon field="user" />
            </div>
            <div className="flex items-center cursor-pointer select-none hover:text-gray-300 min-w-0" onClick={() => handleSort('date')}>
              Date & Time <SortIcon field="date" />
            </div>
            <div className="flex items-center cursor-pointer select-none hover:text-gray-300 min-w-0" onClick={() => handleSort('target')}>
              Target <SortIcon field="target" />
            </div>
            <div className="text-right flex-shrink-0">
              Action
            </div>
          </div>

          {/* ── Table Body ── */}
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Clock className={`w-7 h-7 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No activities found</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Try adjusting your search.</p>
            </div>
          ) : (
            <div>
              {visibleEntries.map((entry) => {
                const date = new Date(entry.createdAt);
                return (
                  <div
                    key={entry.id}
                    className={`group grid grid-cols-1 gap-2 md:gap-4 items-center px-6 py-3.5 border-b transition-colors duration-150
                      ${selectedIds.has(entry.id)
                        ? (darkMode ? 'bg-blue-900/20 border-gray-700/60' : 'bg-blue-50/60 border-gray-100')
                        : (darkMode ? 'border-gray-700/60 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50')
                      }
                    `}
                    style={{ gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth >= 768 ? (bulkMode ? '40px 6fr 1.5fr 2fr 1.5fr 60px' : '6fr 1.5fr 2fr 1.5fr 60px') : '1fr' }}
                  >
                    {/* Checkbox */}
                    {bulkMode && (
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </div>
                    )}

                    {/* Description (with icon) */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center ${getIconBg(entry, darkMode)}`}>
                        {getIconForTarget(entry)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <TruncatedDescription text={entry.description} darkMode={darkMode} />
                        <div className="flex items-center gap-2 mt-0.5 md:hidden">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getActionColor(entry.action, darkMode)}`}>
                            {getActionLabel(entry.action)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-2.5 min-w-0 hidden md:flex">
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold uppercase
                        ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}
                      `}>
                        {(() => {
                          try {
                            const gMap = JSON.parse(localStorage.getItem('global_used_avatars') || '{}');
                            const userKey = entry.userName;
                            let avatar = gMap[userKey];
                            
                            // If user is absent from globalMap but has personal, or fallback to dicebear
                            if (!avatar) {
                              const personal = localStorage.getItem(`user_avatar_${userKey}`);
                              avatar = personal || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userKey}&backgroundColor=b6e3f4&mouth=default,smile,twinkle&eyes=default,happy,wink`;
                            }
                            
                            if (avatar) return <img src={avatar} alt={entry.userName} className="w-full h-full object-cover rounded-full" />;
                          } catch {}
                          return entry.userName.charAt(0);
                        })()}
                      </div>
                      <span className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {entry.userName}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="hidden md:block min-w-0">
                      <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatDateIDFull(date)}
                      </p>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTimeID(date)}
                      </p>
                    </div>

                    {/* Target */}
                    <div className="flex items-center gap-2 min-w-0 hidden md:flex">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0 ${getActionColor(entry.action, darkMode)}`}>
                        {getActionLabel(entry.action)}
                      </span>
                      {entry.targetName && (
                        <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {entry.targetName}
                        </span>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="flex justify-end hidden md:flex min-w-0">
                      {canDelete && !bulkMode && (
                        <button
                          onClick={() => handleDeleteClick(entry.id, entry.description)}
                          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                            ${darkMode ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-400 hover:text-red-600'}
                          `}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleCount < filteredHistory.length && (
                <div className={`text-center py-5 text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Scroll down for more activities
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        show={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete Activity Log"
        message={`Are you sure you want to delete this activity log?\n\n"${entryToDelete?.name || ''}"\n\nThis action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setEntryToDelete(null); }}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteModal
        show={bulkDeleteConfirm}
        darkMode={darkMode}
        title="Delete Selected Activities"
        message={`Are you sure you want to delete ${selectedIds.size} selected activities?\n\nThis action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
    </motion.div>
  );
};

export default HistoryPage;
