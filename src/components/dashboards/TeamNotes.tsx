// src/components/dashboards/TeamNotes.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Star, Plus, Search } from 'lucide-react';
import { Note } from '../../types/database';

interface TeamNotesProps {
  darkMode: boolean;
}

// Extended Note type with color
interface ColoredNote extends Note {
  color: string;
  favorite?: boolean;
  date: string;
}

// Pastel colors like in the image
const noteColors = [
  '#FFD89B', // Yellow/Orange
  '#FFA896', // Coral/Salmon
  '#C4F5A4', // Light Green
  '#B5A4F5', // Light Purple
  '#A4E5F5', // Light Blue
  '#FFB8D1', // Light Pink
];

const TeamNotes: React.FC<TeamNotesProps> = ({ darkMode }) => {
  const [notes, setNotes] = useState<ColoredNote[]>([
    { 
      id: '1', 
      text: 'The beginning of screenless design: UI jobs to be taken over by Solution Architect',
      color: '#FFD89B',
      date: 'May 21, 2020',
      favorite: false
    },
    { 
      id: '2', 
      text: '13 Things You Should Give Up If You Want To Be a Successful UX Designer',
      color: '#FFA896',
      date: 'May 25, 2020',
      favorite: true
    },
    { 
      id: '3', 
      text: 'The Psychology Principles Every UI/UX Designer Needs to Know',
      color: '#C4F5A4',
      date: 'June 5, 2020',
      favorite: false
    },
    { 
      id: '4', 
      text: '10 UI & UX Lessons from Designing My Own Product',
      color: '#B5A4F5',
      date: 'June 12, 2020',
      favorite: true
    },
    { 
      id: '5', 
      text: '52 Research Terms you need to know as a UX Designer',
      color: '#C4F5A4',
      date: 'June 18, 2020',
      favorite: false
    },
    { 
      id: '6', 
      text: 'Text fields & Forms design – UI components series',
      color: '#A4E5F5',
      date: 'June 22, 2020',
      favorite: false
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(noteColors[0]);
  const [editingNote, setEditingNote] = useState<ColoredNote | null>(null);

  const addNote = () => {
    if (!newNoteText.trim()) return;
    
    const newNote: ColoredNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      color: selectedColor,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      favorite: false
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setShowAddModal(false);
    setSelectedColor(noteColors[0]);
  };

  const deleteNote = (id: string) => {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;
    setNotes(notes.filter(n => n.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, favorite: !n.favorite } : n
    ));
  };

  const startEdit = (note: ColoredNote) => {
    setEditingNote(note);
    setNewNoteText(note.text);
    setSelectedColor(note.color);
    setShowAddModal(true);
  };

  const saveEdit = () => {
    if (!editingNote || !newNoteText.trim()) return;
    
    setNotes(notes.map(n => 
      n.id === editingNote.id 
        ? { ...n, text: newNoteText.trim(), color: selectedColor }
        : n
    ));
    
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

  const filteredNotes = notes.filter(note => 
    note.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-full overflow-auto ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}
    >
      <div className="px-8 sm:px-12 lg:px-24 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Notes
            </h1>
            
            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
              title="Add new note"
            >
              <Plus className="w-6 h-6" />
            </button>
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
              {/* Favorite Star */}
              <button
                onClick={() => toggleFavorite(note.id)}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/80 flex items-center justify-center transition-all ${
                  note.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Star 
                  className={`w-5 h-5 ${note.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
                />
              </button>

              {/* Note Text */}
              <p className="text-gray-900 text-lg leading-relaxed flex-1 pr-8">
                {note.text}
              </p>

              {/* Bottom Section */}
              <div className="flex items-center justify-between mt-6">
                <span className="text-gray-700 text-sm">
                  {note.date}
                </span>

                {/* Edit Button */}
                <button
                  onClick={() => startEdit(note)}
                  className="w-10 h-10 rounded-full bg-black/80 hover:bg-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Delete Button - Top Left on Hover */}
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? 'No notes found' : 'No notes yet. Click the + button to add one!'}
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
              placeholder="Write your note here..."
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
                disabled={!newNoteText.trim()}
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
    </motion.div>
  );
};

export default TeamNotes;