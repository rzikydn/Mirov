import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, Database as DatabaseIcon, Calendar, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { HistoryEntry, useHistory } from '../../../context/HistoryContext';
import { getTimeAgo } from '../../../utils/timeAgo';
import { useAuth } from '../../../context/AuthContext';
import DeleteModal from './DeleteModal';

interface HistoryModalProps {
  show: boolean;
  darkMode: boolean;
  history: HistoryEntry[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ show, darkMode, history, onClose }) => {
  const { deleteHistory } = useHistory();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: number; name: string } | null>(null);

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is SUPERUSER only
  const canDelete = user?.role === 'SUPERUSER';

  if (!show) return null;

  const handleDeleteClick = (id: number, entryName: string) => {
    if (!canDelete) {
      toast.error('Only SUPERUSER can delete history entries', {
        icon: '🔒',
      });
      return;
    }

    setEntryToDelete({ id, name: entryName });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    setShowDeleteConfirm(false);
    setDeletingId(entryToDelete.id);

    // Show loading toast
    const loadingToast = toast.loading('Deleting history entry...');

    const success = await deleteHistory(entryToDelete.id);
    setDeletingId(null);

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    if (success) {
      toast.success('History entry deleted successfully!');
    } else {
      toast.error('Failed to delete history entry. Please try again.');
    }

    setEntryToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  // Bulk delete functions
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(entry => entry.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one history entry');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    setIsDeleting(true);

    const loadingToast = toast.loading(`Deleting ${selectedIds.size} history entries...`);

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const success = await deleteHistory(id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedIds(new Set());
    toast.dismiss(loadingToast);

    if (failCount === 0) {
      toast.success(`Successfully deleted ${successCount} history entries!`);
    } else {
      toast.error(`Deleted ${successCount} entries, ${failCount} failed`);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
  };

  // Helper function to check if entry is a favorite action
  const isFavoriteAction = (entry: HistoryEntry): boolean => {
    return entry.description.includes('added note to favorites');
  };

  // Helper function to check if entry is an unfavorite action
  const isUnfavoriteAction = (entry: HistoryEntry): boolean => {
    return entry.description.includes('removed note from favorites');
  };

  const getIcon = (target: 'note' | 'database' | 'schedule', entry?: HistoryEntry) => {
    // Show yellow star icon for favorite actions
    if (entry && isFavoriteAction(entry)) {
      return <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
    }

    // Show red star icon for unfavorite actions
    if (entry && isUnfavoriteAction(entry)) {
      return <Star className="w-4 h-4 fill-red-400 text-red-400" />;
    }

    switch (target) {
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'database':
        return <DatabaseIcon className="w-4 h-4" />;
      case 'schedule':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: 'create' | 'edit' | 'delete') => {
    switch (action) {
      case 'create':
        return darkMode ? 'text-green-400' : 'text-green-600';
      case 'edit':
        return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'delete':
        return darkMode ? 'text-red-400' : 'text-red-600';
    }
  };

  const getActionBadgeClasses = (action: 'create' | 'edit' | 'delete', entry?: HistoryEntry) => {
    const baseClasses = 'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold';

    // Special styling for favorite actions (yellow)
    if (entry && isFavoriteAction(entry)) {
      return `${baseClasses} ${darkMode ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600' : 'bg-yellow-100 text-yellow-700 border border-yellow-400'}`;
    }

    // Special styling for unfavorite actions (red)
    if (entry && isUnfavoriteAction(entry)) {
      return `${baseClasses} ${darkMode ? 'bg-red-900/50 text-red-300 border border-red-600' : 'bg-red-100 text-red-700 border border-red-400'}`;
    }

    switch (action) {
      case 'create':
        return `${baseClasses} ${darkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'}`;
      case 'edit':
        return `${baseClasses} ${darkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'}`;
      case 'delete':
        return `${baseClasses} ${darkMode ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200'}`;
    }
  };

  const getActionText = (action: 'create' | 'edit' | 'delete', entry?: HistoryEntry) => {
    // Special text for favorite actions
    if (entry && isFavoriteAction(entry)) {
      return 'Favorit';
    }

    // Special text for unfavorite actions
    if (entry && isUnfavoriteAction(entry)) {
      return 'Unfavorit';
    }

    switch (action) {
      case 'create':
        return 'Added';
      case 'edit':
        return 'Changed';
      case 'delete':
        return 'Deleted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
        } rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Activity History
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Bulk actions - Only for SUPERUSER */}
          {canDelete && history.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === history.length && history.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select All ({selectedIds.size}/{history.length})
                  </span>
                </label>
              </div>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  disabled={isDeleting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isDeleting
                      ? 'opacity-50 cursor-not-allowed'
                      : darkMode
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-700'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No activity yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative p-4 rounded-lg border transition-colors ${
                    selectedIds.has(entry.id)
                      ? darkMode
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-blue-50 border-blue-300'
                      : darkMode
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  } ${deletingId === entry.id || isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for SUPERUSER */}
                    {canDelete && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        disabled={isDeleting}
                        className="w-4 h-4 mt-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      {getIcon(entry.target, entry)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {entry.userName}
                        </span>
                        <span className={getActionBadgeClasses(entry.action, entry)}>
                          {getActionText(entry.action, entry)}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="capitalize">
                          {entry.target === 'note' ? 'Note' : entry.target === 'database' ? 'Database' : 'Schedule'}
                        </span>
                        {entry.targetName && (
                          <>
                            {' - '}
                            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              "{entry.targetName}"
                            </span>
                          </>
                        )}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {getTimeAgo(entry.createdAt)}
                      </p>
                    </div>
                    {/* Delete button - Only for SUPERUSER */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteClick(entry.id, entry.description)}
                        disabled={deletingId === entry.id}
                        className={`opacity-0 group-hover:opacity-100 p-2 rounded transition-all ${
                          darkMode
                            ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300'
                            : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                        } ${deletingId === entry.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete history entry (SUPERUSER only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded text-sm font-medium ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete History Entry"
        message={`Are you sure you want to delete this history entry?\n\n"${entryToDelete?.name || ''}"\n\nThis action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteModal
        show={showBulkDeleteConfirm}
        darkMode={darkMode}
        title="Delete Multiple History Entries"
        message={`Are you sure you want to delete ${selectedIds.size} history entries?\n\nThis action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        onCancel={cancelBulkDelete}
      />
    </div>
  );
};

export default HistoryModal;
