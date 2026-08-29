import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, FileText, Database as DatabaseIcon, Calendar, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { HistoryEntry, useHistory } from '../../../context/HistoryContext';
import { useAuth } from '../../../context/AuthContext';
import DeleteModal from './DeleteModal';
import { ContributionGraph } from '../ContributionGraph';
import { getUserAvatar } from '../../../services/avatarService';

interface HistoryModalProps {
  show: boolean;
  darkMode: boolean;
  history: HistoryEntry[];
  onClose: () => void;
}

// ── Constants ──
const ITEMS_PER_PAGE = 30;

// ── Helper: format time (24-hour Indonesian format) ──
const formatTime = (date: Date | string): string => {
  let d = typeof date === 'string' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) {
    if (typeof date === 'string') {
      const sanitized = date.includes('T') || date.includes('Z') || date.includes('+')
        ? date
        : date.replace(' ', 'T') + '+07:00';
      d = new Date(sanitized);
    }
  }
  if (!d || isNaN(d.getTime())) return '--.-- WIB';
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${formatter.format(d).replace(':', '.')} WIB`;
};

// ── Helper: format date label ──
const formatDateLabel = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// ── Helper: get date key (YYYY-MM-DD) in Asia/Jakarta ──
const getDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return parts;
};

// ── Helper: check if same day ──
const isSameDay = (a: Date, b: Date): boolean => {
  return getDateKey(a) === getDateKey(b);
};

// ── Helper: truncate long description ──
const truncateDescription = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
};

// ── Single Timeline Entry (memoized for perf) ──
const TimelineEntry = React.memo(({
  entry,
  darkMode,
  canDelete,
  isSelected,
  isDeleting,
  isExpanded,
  onToggleSelect,
  onDelete,
  onToggleExpand
}: {
  entry: HistoryEntry;
  darkMode: boolean;
  canDelete: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  isExpanded: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onToggleExpand: (id: number) => void;
}) => {
  const isFav = entry.description.includes('added note to favorites');
  const isUnfav = entry.description.includes('removed note from favorites');
  const isLongText = entry.description.length > 100;

  const getIcon = () => {
    if (isFav) return <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />;
    if (isUnfav) return <Star className="w-3.5 h-3.5 fill-red-400 text-red-400" />;
    switch (entry.target) {
      case 'note': return <FileText className="w-3.5 h-3.5" />;
      case 'database': return <DatabaseIcon className="w-3.5 h-3.5" />;
      case 'schedule': return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  const getIconBg = () => {
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

  const getActionLabel = () => {
    if (isFav) return { text: 'Favorited', color: darkMode ? 'text-yellow-400' : 'text-yellow-600' };
    if (isUnfav) return { text: 'Unfavorited', color: darkMode ? 'text-red-400' : 'text-red-600' };
    switch (entry.action) {
      case 'create': return { text: 'Created', color: darkMode ? 'text-emerald-400' : 'text-emerald-600' };
      case 'edit': return { text: 'Changed', color: darkMode ? 'text-blue-400' : 'text-blue-600' };
      case 'delete': return { text: 'Deleted', color: darkMode ? 'text-red-400' : 'text-red-600' };
      case 'added': return { text: 'Added', color: darkMode ? 'text-purple-400' : 'text-purple-600' };
      default: return { text: entry.action, color: darkMode ? 'text-gray-400' : 'text-gray-600' };
    }
  };

  const time = formatTime(new Date(entry.createdAt));
  const actionLabel = getActionLabel();
  const displayDescription = isExpanded ? entry.description : truncateDescription(entry.description);
  const avatarUrl = getUserAvatar(entry.userName, entry.userAvatar || entry.user?.avatar);

  return (
    <div className={`group flex items-start gap-3 py-3.5 px-4 rounded-xl transition-colors duration-100 mb-1.5
      ${isSelected
        ? darkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
        : darkMode ? 'hover:bg-gray-700/40 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
      }
      ${isDeleting ? 'opacity-40 pointer-events-none' : ''}
    `}>
      {/* Checkbox */}
      {canDelete && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(entry.id)}
          disabled={isDeleting}
          className="custom-checkbox mt-1.5 flex-shrink-0"
        />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg()}`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* First line: User + Action + Time */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <img
            src={avatarUrl}
            alt={entry.userName}
            className="w-4 h-4 rounded-full bg-sky-100 object-cover border border-sky-200 shrink-0"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {entry.userName}
          </span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${actionLabel.color} ${darkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
            {actionLabel.text}
          </span>
          <span className={`text-xs font-mono ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {time}
          </span>
        </div>

        {/* Second line: Description (truncated) */}
        <p
          className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}
            ${isLongText && !isExpanded ? 'cursor-pointer' : ''}
          `}
          onClick={isLongText ? () => onToggleExpand(entry.id) : undefined}
        >
          {displayDescription}
          {isLongText && !isExpanded && (
            <span className={`ml-1 text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
              Show more
            </span>
          )}
          {isLongText && isExpanded && (
            <span
              className={`ml-1 text-xs font-medium cursor-pointer ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}
              onClick={(e) => { e.stopPropagation(); onToggleExpand(entry.id); }}
            >
              Show less
            </span>
          )}
        </p>

        {/* Third line: Target info */}
        {entry.targetName && (
          <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className="capitalize">{entry.target}</span>
            {' · '}
            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{entry.targetName}</span>
          </p>
        )}
      </div>

      {/* Delete */}
      {canDelete && (
        <button
          onClick={() => onDelete(entry.id, entry.description)}
          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all flex-shrink-0 mt-1
            ${darkMode ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-50 text-red-500'}
          `}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

TimelineEntry.displayName = 'TimelineEntry';


// ══════════════════════════════════════════════
// ██ MAIN COMPONENT
// ══════════════════════════════════════════════
const HistoryModal: React.FC<HistoryModalProps> = ({ show, darkMode, history, onClose }) => {
  const { deleteHistory } = useHistory();
  const { user } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const canDelete = user?.role === 'SUPERUSER';

  // ── Pre-compute: activity count per day (Map) ──
  const activityCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of history) {
      const key = getDateKey(new Date(entry.createdAt));
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [history]);

  // ── Filtered entries for selected date ──
  const filteredEntries = useMemo(() => {
    return history.filter(entry =>
      isSameDay(new Date(entry.createdAt), selectedDate)
    );
  }, [history, selectedDate]);

  // ── Visible entries (paginated) ──
  const visibleEntries = useMemo(() => {
    return filteredEntries.slice(0, visibleCount);
  }, [filteredEntries, visibleCount]);

  // Reset visible count when date changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    setExpandedIds(new Set());
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selectedDate]);

  // ── Infinite scroll handler ──
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      if (visibleCount < filteredEntries.length) {
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredEntries.length));
      }
    }
  }, [visibleCount, filteredEntries.length]);

  // ── Toggle expand description ──
  const toggleExpand = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Delete handlers ──
  const handleDeleteClick = useCallback((id: number, entryName: string) => {
    if (!canDelete) {
      toast.error('Only SUPERUSER can delete history entries', { icon: '🔒' });
      return;
    }
    setEntryToDelete({ id, name: entryName });
    setShowDeleteConfirm(true);
  }, [canDelete]);

  const confirmDelete = useCallback(async () => {
    if (!entryToDelete) return;
    setShowDeleteConfirm(false);
    setDeletingId(entryToDelete.id);
    const loadingToast = toast.loading('Deleting history entry...');
    const success = await deleteHistory(entryToDelete.id);
    setDeletingId(null);
    toast.dismiss(loadingToast);
    if (success) toast.success('History entry deleted!');
    else toast.error('Failed to delete. Please try again.');
    setEntryToDelete(null);
  }, [entryToDelete, deleteHistory]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map(e => e.id)));
    }
  }, [selectedIds.size, filteredEntries]);

  const confirmBulkDelete = useCallback(async () => {
    setShowBulkDeleteConfirm(false);
    setIsDeleting(true);
    const loadingToast = toast.loading(`Deleting ${selectedIds.size} entries...`);
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedIds) {
      const success = await deleteHistory(id);
      if (success) successCount++; else failCount++;
    }
    setIsDeleting(false);
    setSelectedIds(new Set());
    toast.dismiss(loadingToast);
    if (failCount === 0) toast.success(`Deleted ${successCount} entries!`);
    else toast.error(`Deleted ${successCount}, ${failCount} failed`);
  }, [selectedIds, deleteHistory]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden`}
      >
        {/* ═══ Header ═══ */}
        <div className={`px-5 pt-5 pb-4`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Daily Activity
            </h2>
            <div className="flex items-center gap-1">
              {canDelete && selectedIds.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isDeleting}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mr-2 transition-colors
                    ${darkMode
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-700'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Trash2 className="w-3 h-3" />
                  {selectedIds.size}
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ═══ Contribution Graph ═══ */}
          <div className="mb-4">
            <ContributionGraph
              activityCountMap={activityCountMap}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              darkMode={darkMode}
              year={selectedDate.getFullYear()}
            />
          </div>

          {/* Selected date label + count */}
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatDateLabel(selectedDate)}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${filteredEntries.length > 0
                ? darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
              }
            `}>
              {filteredEntries.length} {filteredEntries.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          {/* Select All (SUPERUSER only) */}
          {canDelete && filteredEntries.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer mt-2 group">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                onChange={toggleSelectAll}
                className="custom-checkbox"
              />
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-500 group-hover:text-gray-700'}`}>
                Select All ({selectedIds.size}/{filteredEntries.length})
              </span>
            </label>
          )}
        </div>

        {/* ═══ Timeline entries ═══ */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto custom-scrollbar border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
        >
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Clock className={`w-6 h-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No activity on this date
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Select a highlighted date to view activities
              </p>
            </div>
          ) : (
            <div className="py-2 px-2">
              {visibleEntries.map(entry => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  darkMode={darkMode}
                  canDelete={canDelete}
                  isSelected={selectedIds.has(entry.id)}
                  isDeleting={deletingId === entry.id || isDeleting}
                  isExpanded={expandedIds.has(entry.id)}
                  onToggleSelect={toggleSelect}
                  onDelete={handleDeleteClick}
                  onToggleExpand={toggleExpand}
                />
              ))}

              {/* Load more indicator */}
              {visibleCount < filteredEntries.length && (
                <div className={`text-center py-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Scroll for more ({filteredEntries.length - visibleCount} remaining)
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete History Entry"
        message={`Are you sure you want to delete this history entry?\n\n"${entryToDelete?.name || ''}"\n\nThis action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setEntryToDelete(null); }}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteModal
        show={showBulkDeleteConfirm}
        darkMode={darkMode}
        title="Delete Multiple History Entries"
        message={`Are you sure you want to delete ${selectedIds.size} history entries?\n\nThis action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
};

export default HistoryModal;
