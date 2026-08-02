// src/components/dashboards/TeamNotes.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Trash2, Star, Plus, Search, ChevronRight, Clock } from 'lucide-react';
import { Note } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import DeleteModal from './modals/DeleteModal';
import {
  Expandable,
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardHeader,
  ExpandableContent,
  ExpandableTrigger,
} from '@/components/ui/expandable';
import { apiFetch } from '@/services/offlineSync';

interface TeamNotesProps {
  darkMode: boolean;
}

// Update Note type to accept both string and number IDs to match API
interface FlexibleNote extends Omit<Note, 'id'> {
  id: string | number;
}

// Extended Note type with color
interface ColoredNote extends FlexibleNote {
  content?: string; // Field dari backend API
  color: string;
  favorite?: boolean;
  date: string;
  createdAt?: string; // Field dari backend API
  updatedAt?: string; // Field dari backend API
  user?: { name: string; role?: string };
}

// Post-it colors: Red, Yellow, Green
const noteColors = [
  '#FFA896', // Red
  '#FFD89B', // Yellow
  '#C4F5A4', // Green
];

// ⭐ FUNGSI BARU: Format tanggal ke bahasa Indonesia (format pendek)
const formatDateIndonesian = (dateString: string): string => {
  const date = new Date(dateString);

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

// Helper to render a visual badge with anchors for different note status/color
const renderStatusBadge = (color: string, darkMode: boolean) => {
  const normColor = color.toLowerCase();

  if (normColor.includes('a896') || normColor.includes('red') || normColor.includes('rose')) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
        darkMode
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-red-50 border-red-100 text-red-700'
      }`}>
        High Priority
      </span>
    );
  }

  if (normColor.includes('d89b') || normColor.includes('yellow') || normColor.includes('amber')) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
        darkMode
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}>
        Medium Priority
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
      darkMode
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
    }`}>
      Low Priority
    </span>
  );
};

// Helper to get DiceBear avatar URL for note creator based on global registry or fallback
const getCreatorAvatar = (note: any, currentUser: any): string => {
  const creatorName = note.user?.name || note.createdBy?.name || note.userName || currentUser?.name || 'Unknown';
  const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';

  try {
    const globalMapStr = localStorage.getItem('global_used_avatars');
    const globalMap = globalMapStr ? JSON.parse(globalMapStr) : {};
    if (globalMap[creatorName]) {
      return globalMap[creatorName];
    }
  } catch (e) {
    console.error('Error reading global_used_avatars:', e);
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}&backgroundColor=b6e3f4${safeParams}`;
};

const TeamNotes: React.FC<TeamNotesProps> = ({ darkMode }) => {
  const { user, canManageSchedules, token } = useAuth();
  const { addHistory } = useHistory();
  const API_URL = `${import.meta.env.VITE_API_URL}/api/notes`;

  // Check if user can edit (ADMIN or SUPERUSER)
  const canEdit = canManageSchedules();

  // Get auth headers
  const getAuthHeaders = () => {
    const authToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    };
  };

  // Instant 0ms load from localStorage cache
  const [notes, setNotes] = useState<ColoredNote[]>(() => {
    try {
      const cached = localStorage.getItem('mirov_cached_notes');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  // Helper to update state and sync localStorage cache immediately
  const updateNotesAndCache = (updater: ColoredNote[] | ((prev: ColoredNote[]) => ColoredNote[])) => {
    setNotes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('mirov_cached_notes', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Fetch notes dari backend dengan offline fallback
  const fetchNotes = async () => {
    const { ok, data } = await apiFetch(API_URL, {}, 'notes');
    if (ok && data) {
      const list = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : null);
      if (list) {
        updateNotesAndCache(list);
      }
    }
  };

  // Realtime Optimistic Tambah note (0ms UI response)
  const createNote = async (note: { text: string; color: string; userId: number }) => {
    const tempId = `temp-${Date.now()}`;
    const newNote: ColoredNote = {
      id: tempId,
      content: note.text,
      text: note.text,
      color: note.color,
      date: formatDateIndonesian(new Date().toISOString()),
      createdAt: new Date().toISOString(),
      user: user ? { name: user.name, role: user.role } : undefined
    };

    // Optimistic UI insert (INSTANT 0ms)
    updateNotesAndCache((prev) => [newNote, ...prev]);

    if (user) {
      addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'create',
        target: 'note',
        targetName: note.text.substring(0, 30) + (note.text.length > 30 ? '...' : ''),
        description: `${user.name} added a note`
      });
    }

    const { ok, data } = await apiFetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ content: note.text, color: note.color }),
    });

    if (ok && data && data.data && data.data.id) {
      updateNotesAndCache((prev) =>
        prev.map((n) => (n.id === tempId ? { ...data.data, content: data.data.content || note.text, text: data.data.content || note.text } : n))
      );
    }
  };

  // Realtime Optimistic Update note (0ms UI response)
  const editNote = async (id: string | number, note: { text: string; color: string; favorite: boolean }) => {
    // Optimistic UI update (INSTANT 0ms)
    updateNotesAndCache((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: note.text, text: note.text, color: note.color, favorite: note.favorite } : n))
    );

    if (user) {
      addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'edit',
        target: 'note',
        targetName: note.text.substring(0, 30) + (note.text.length > 30 ? '...' : ''),
        description: `${user.name} changed a note`
      });
    }

    await apiFetch(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        content: note.text,
        color: note.color,
        favorite: note.favorite
      }),
    });
  };

  // Realtime Optimistic Hapus note (0ms UI response)
  const removeNote = async (id: string | number) => {
    // Optimistic UI delete (INSTANT 0ms)
    updateNotesAndCache((prev) => prev.filter((n) => n.id !== id));

    if (user) {
      addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'delete',
        target: 'note',
        description: `${user.name} deleted a note`
      });
    }

    await apiFetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });
  };

  // Realtime Polling & Window Focus Listener & Data Synced Listener
  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 3000);
    const handleFocus = () => fetchNotes();
    const handleDataSynced = () => fetchNotes();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('app:data-synced', handleDataSynced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('app:data-synced', handleDataSynced);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(noteColors[0]);
  const [editingNote, setEditingNote] = useState<ColoredNote | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<{ id: string | number; text: string } | null>(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ColoredNote | null>(null);

  const addNote = () => {
    if (!newNoteText.trim()) return;

    // ⭐ DITAMBAHKAN: CEK LOGIN
    if (!user) {
      alert('Please login first');
      return;
    }

    createNote({
      text: newNoteText.trim(),
      color: selectedColor,
      userId: user.id
    });

    setNewNoteText('');
    setShowAddModal(false);
    setSelectedColor(noteColors[0]);
  };

  const handleDeleteClick = (note: ColoredNote) => {
    setNoteToDelete({
      id: note.id,
      text: (note.content || note.text || '').substring(0, 50) + ((note.content || note.text || '').length > 50 ? '...' : '')
    });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!noteToDelete) return;

    setShowDeleteConfirm(false);
    removeNote(noteToDelete.id);
    setNoteToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const toggleFavorite = async (note: ColoredNote) => {
    const newFavoriteStatus = !note.favorite;
    const noteContent = note.content || note.text || '';

    // Update state lokal terlebih dahulu untuk animasi instant
    setNotes(prevNotes =>
      prevNotes.map(n =>
        n.id === note.id
          ? { ...n, favorite: newFavoriteStatus }
          : n
      )
    );

    // Kemudian update ke backend
    try {
      const res = await fetch(`${API_URL}/${note.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: noteContent,
          color: note.color,
          favorite: newFavoriteStatus
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Add to history dengan deskripsi spesifik untuk favorit
        if (user) {
          await addHistory({
            userName: user.name,
            userRole: user.role,
            action: 'edit', // Use 'edit' instead of 'favorite'/'unfavorite'
            target: 'note',
            targetName: noteContent.substring(0, 30) + (noteContent.length > 30 ? '...' : ''),
            description: `${user.name} ${newFavoriteStatus ? 'added note to favorites' : 'removed note from favorites'}`
          });
        }
      } else {
        // Jika gagal, kembalikan state ke semula
        setNotes(prevNotes =>
          prevNotes.map(n =>
            n.id === note.id
              ? { ...n, favorite: note.favorite }
              : n
          )
        );
        console.error('❌ Toggle favorite failed:', data);
      }
    } catch (err) {
      // Jika error, kembalikan state ke semula
      setNotes(prevNotes =>
        prevNotes.map(n =>
          n.id === note.id
            ? { ...n, favorite: note.favorite }
            : n
        )
      );
      console.error("Failed to toggle favorite:", err);
    }
  };

  const startEdit = (note: ColoredNote) => {
    setEditingNote(note);
    setNewNoteText(note.text);
    setSelectedColor(note.color);
    setShowAddModal(true);
  };

  const saveEdit = () => {
    if (!editingNote || !newNoteText.trim()) return;

    editNote(editingNote.id, {
      text: newNoteText.trim(),
      color: selectedColor,
      favorite: editingNote.favorite || false
    });

    setEditingNote(null);
    setNewNoteText('');
    setShowAddModal(false);
    setSelectedColor(noteColors[0]);
  };

  const cancelModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setNewNoteText('');
    setSelectedColor(noteColors[0]);
  };

  const filteredNotes = notes.filter(note => {
    const noteText = note.text || note.content || '';
    return noteText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-full overflow-auto hide-scrollbar ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}
    >
      <div className="px-4 sm:px-6 lg:px-12 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Notes
            </h1>

            {/* Add Button - Only for ADMIN/SUPERUSER */}
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className={`w-14 h-14 rounded-full ${darkMode
                  ? 'bg-white hover:bg-gray-100 text-gray-900'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
                  } flex items-center justify-center shadow-lg transition-all hover:scale-105`}
                title="Add new note"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className={`relative max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className={`w-full pl-12 pr-4 py-3 rounded-lg ${darkMode
                ? 'bg-gray-800 text-white placeholder-gray-500'
                : 'bg-white text-gray-900 placeholder-gray-400'
                } border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Notes Grid - Expandable Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotes.map((note) => {
            const noteText = note.content || note.text || '';
            const truncatedText = noteText.length > 60 ? noteText.substring(0, 60) + '...' : noteText;
            const noteDate = note.createdAt ? formatDateIndonesian(note.createdAt) : (note.date ? formatDateIndonesian(note.date) : '');

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Expandable
                  expandDirection="vertical"
                  expandBehavior="replace"
                  initialDelay={0.05}
                >
                  {({ isExpanded }) => (
                    <ExpandableTrigger>
                      <ExpandableCard
                        className="w-full"
                        darkMode={darkMode}
                        collapsedSize={{ height: 210 }}
                        expandedSize={{ height: undefined }}
                        hoverToExpand={false}
                      >
                        <ExpandableCardHeader className="p-0 mb-4 flex-shrink-0">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              {renderStatusBadge(note.color, darkMode)}
                            </div>
                            <div className="flex gap-1">
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(note);
                                  }}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                    darkMode 
                                      ? 'hover:bg-neutral-800 text-neutral-400 hover:text-amber-400' 
                                      : 'hover:bg-amber-50 text-gray-400 hover:text-amber-500'
                                  }`}
                                  title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Star
                                    strokeWidth={1.5}
                                    className={`w-4 h-4 transition-all duration-300 transform hover:scale-110 ${
                                      note.favorite 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'text-current'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        </ExpandableCardHeader>

                        <ExpandableCardContent className="p-0 overflow-hidden flex-grow flex flex-col justify-between">
                          <div className="flex-grow flex flex-col justify-between h-full">
                            <div className="mb-3">
                              <p className={`text-base font-medium leading-snug tracking-tight ${darkMode ? 'text-neutral-100' : 'text-slate-900'}`}>
                                {isExpanded ? noteText : truncatedText}
                              </p>
                            </div>

                            <div className={`flex items-center text-xs ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                              <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                              <span>{noteDate}</span>
                            </div>
                          </div>

                          <ExpandableContent preset="blur-md" stagger staggerChildren={0.1}>
                            {note.updatedAt && (
                              <div className={`mt-2 text-xs ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                                Updated: {formatDateIndonesian(note.updatedAt)}
                              </div>
                            )}

                            <div className={`mt-4 flex items-center gap-3 border-t pt-4 ${darkMode ? 'border-neutral-800 text-neutral-300' : 'border-slate-100 text-slate-700'}`}>
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
                                <img
                                  src={getCreatorAvatar(note, user)}
                                  alt={(note as any).user?.name || (note as any).createdBy?.name || (note as any).userName || user?.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {(note as any).user?.name || (note as any).createdBy?.name || (note as any).userName || user?.name || 'Unknown'}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                                  {(note as any).user?.role || (note as any).createdBy?.role || (note as any).userRole || user?.role || 'User'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNote(note);
                                  setShowDetailSidebar(true);
                                }}
                                className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                                  darkMode
                                    ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  View Details
                                </span>
                              </button>

                              {canEdit && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(note);
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all border ${
                                      darkMode
                                        ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="flex items-center justify-center gap-1.5">
                                      <Edit3 className="w-3.5 h-3.5" />
                                      Edit
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(note);
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    <span className="flex items-center justify-center gap-1.5">
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className={`flex items-center justify-between w-full mt-4 border-t pt-4 text-[11px] font-medium ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: note.color }} />
                                {note.favorite ? '⭐ Favorited' : 'Note'}
                              </span>
                              <span>Click to collapse</span>
                            </div>
                          </ExpandableContent>
                        </ExpandableCardContent>
                      </ExpandableCard>
                    </ExpandableTrigger>
                  )}
                </Expandable>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery
                ? 'No notes found'
                : canEdit
                  ? 'No notes yet. Click the + button to add one!'
                  : 'No notes available yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl p-6 w-full max-w-lg shadow-2xl`}
          >
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </h3>

            {/* Note Text Input */}
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl/Cmd + Enter to save
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (newNoteText && newNoteText.trim()) {
                    editingNote ? saveEdit() : addNote();
                  }
                }
              }}
              placeholder="Write your note here... (Ctrl+Enter to save)"
              autoFocus
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            />

            {/* Color Picker */}
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose Color
              </label>
              <div className="flex gap-3">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${selectedColor === color
                      ? 'ring-4 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={editingNote ? saveEdit : addNote}
                disabled={!newNoteText || !newNoteText.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {editingNote ? 'Save Changes' : 'Add Note'}
              </button>
              <button
                onClick={cancelModal}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete Note"
        message={`Are you sure you want to delete this note?\n\n"${noteToDelete?.text || ''}"\n\nThis action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Detail Sidebar */}
      <AnimatePresence>
        {showDetailSidebar && selectedNote && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => {
                setShowDetailSidebar(false);
                setSelectedNote(null);
              }}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'
                } overflow-y-auto`}
            >
              {/* Sidebar Header */}
              <div className={`sticky top-0 z-10 px-6 py-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Note Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailSidebar(false);
                      setSelectedNote(null);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Note Preview */}
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Content
                  </h3>
                  <div
                    className="rounded-xl p-4 shadow-sm"
                    style={{ backgroundColor: selectedNote.color }}
                  >
                    <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content || selectedNote.text || ''}
                    </p>
                  </div>
                </div>

                {/* Creation Date */}
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Created
                  </h3>
                  <p className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedNote.createdAt
                      ? formatDateIndonesian(selectedNote.createdAt)
                      : (selectedNote.date ? formatDateIndonesian(selectedNote.date) : 'N/A')}
                  </p>
                </div>

                {/* Last Updated */}
                {selectedNote.updatedAt && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      Last Updated
                    </h3>
                    <p className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDateIndonesian(selectedNote.updatedAt)}
                    </p>
                  </div>
                )}

                {/* Creator Info */}
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Created By
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
                      <img
                        src={getCreatorAvatar(selectedNote, user)}
                        alt={(selectedNote as any).user?.name || (selectedNote as any).createdBy?.name || (selectedNote as any).userName || user?.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(selectedNote as any).user?.name ||
                          (selectedNote as any).createdBy?.name ||
                          (selectedNote as any).userName ||
                          user?.name ||
                          'Unknown User'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(selectedNote as any).user?.role ||
                          (selectedNote as any).createdBy?.role ||
                          (selectedNote as any).userRole ||
                          user?.role ||
                          'User'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favorite Status */}
                {selectedNote.favorite && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      Status
                    </h3>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Favorited
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamNotes;