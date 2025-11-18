// src/components/dashboards/TeamNotes.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Trash2, Star, Plus, Search, ChevronRight } from 'lucide-react';
import { Note } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import DeleteModal from './modals/DeleteModal';

interface TeamNotesProps {
  darkMode: boolean;
}

// Extended Note type with color
interface ColoredNote extends Note {
  content?: string; // Field dari backend API
  color: string;
  favorite?: boolean;
  date: string;
  createdAt?: string; // Field dari backend API
  updatedAt?: string; // Field dari backend API
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

  // Fetch notes dari backend
  const fetchNotes = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        console.warn("Notes API not available, using empty array");
        setNotes([]);
        return;
      }
      const data = await res.json();
      // Pastikan data adalah array
      if (Array.isArray(data)) {
        setNotes(data);
      } else if (data.data && Array.isArray(data.data)) {
        setNotes(data.data);
      } else {
        console.warn("Notes response is not an array, using empty array");
        setNotes([]);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setNotes([]); // Set empty array on error
    }
  };

  // Tambah note
  const createNote = async (note: { text: string; color: string; userId: number }) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: note.text, color: note.color }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Add to history
        if (user) {
          await addHistory({
            userName: user.name,
            userRole: user.role,
            action: 'create',
            target: 'note',
            targetName: note.text.substring(0, 30) + (note.text.length > 30 ? '...' : ''),
            description: `${user.name} added a note`
          });
        }
        // Refresh notes list
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  // Update note
  const editNote = async (id: number, note: { text: string; color: string; favorite: boolean }) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: note.text,
          color: note.color,
          favorite: note.favorite
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Add to history
        if (user) {
          await addHistory({
            userName: user.name,
            userRole: user.role,
            action: 'edit',
            target: 'note',
            targetName: note.text.substring(0, 30) + (note.text.length > 30 ? '...' : ''),
            description: `${user.name} changed a note`
          });
        }
        // Refresh notes list
        fetchNotes();
      } else {
        console.error('❌ Update failed:', data);
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  // Hapus note
  const removeNote = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        // Add to history
        if (user) {
          await addHistory({
            userName: user.name,
            userRole: user.role,
            action: 'delete',
            target: 'note',
            description: `${user.name} deleted a note`
          });
        }
        // Refresh notes list
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // Ambil data saat component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const [notes, setNotes] = useState<ColoredNote[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(noteColors[0]);
  const [editingNote, setEditingNote] = useState<ColoredNote | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<{ id: number; text: string } | null>(null);
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
      className={`h-full overflow-auto ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}
    >
      <div className="px-4 sm:px-6 lg:px-12 py-12">
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
                className={`w-14 h-14 rounded-full ${
                  darkMode
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
              className={`w-full pl-12 pr-4 py-3 rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              } border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 min-h-[280px] flex flex-col"
              style={{ backgroundColor: note.color }}
            >
              {/* Favorite Star - Only for ADMIN/SUPERUSER */}
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(note);
                  }}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/80 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    note.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-5 h-5 transition-all duration-300 ${note.favorite ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-white scale-100'}`}
                  />
                </button>
              )}

              {/* Note Text */}
              <p className="text-gray-900 text-lg leading-relaxed flex-1 pr-8">
                {note.content || note.text || ''}
              </p>

              {/* Bottom Section */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex flex-col gap-2">
                  {/* ⭐ DIUBAH: Format tanggal menggunakan fungsi baru */}
                  <span className="text-gray-700 text-sm font-medium">
                    {note.createdAt ? formatDateIndonesian(note.createdAt) : (note.date ? formatDateIndonesian(note.date) : '')}
                  </span>

                  {/* Detail Button */}
                  <button
                    onClick={() => {
                      setSelectedNote(note);
                      setShowDetailSidebar(true);
                    }}
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Edit Button - Only for ADMIN/SUPERUSER */}
                {canEdit && (
                  <button
                    onClick={() => startEdit(note)}
                    className="w-10 h-10 rounded-full bg-black/80 hover:bg-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* Delete Button - Top Left on Hover - Only for ADMIN/SUPERUSER */}
              {canEdit && (
                <button
                  onClick={() => handleDeleteClick(note)}
                  className="absolute top-4 left-4 w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </motion.div>
          ))}
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
            className={`${
              darkMode ? 'bg-gray-800' : 'bg-white'
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
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
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
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color 
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
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  darkMode
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
              className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 shadow-2xl ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } overflow-y-auto`}
            >
            {/* Sidebar Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    darkMode
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
                <h3 className={`text-sm font-semibold mb-3 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
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
                <h3 className={`text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
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
                  <h3 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
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
                <h3 className={`text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Created By
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {(selectedNote as any).createdBy?.name?.charAt(0).toUpperCase() ||
                     (selectedNote as any).userName?.charAt(0).toUpperCase() ||
                     user?.name?.charAt(0).toUpperCase() ||
                     'U'}
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(selectedNote as any).createdBy?.name ||
                       (selectedNote as any).userName ||
                       user?.name ||
                       'Unknown User'}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(selectedNote as any).createdBy?.role ||
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
                  <h3 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
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