// src/components/dashboards/TeamNotes.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';
import { Note } from '../../types/database';

interface TeamNotesProps {
  darkMode: boolean;
}

const TeamNotes: React.FC<TeamNotesProps> = ({ darkMode }) => {
  const [todo, setTodo] = useState<Note[]>([
    { id: 't1', text: 'Design hero section' },
    { id: 't2', text: 'Write README' },
  ]);
  const [inProgress, setInProgress] = useState<Note[]>([
    { id: 'p1', text: 'Implement auth' }
  ]);
  const [done, setDone] = useState<Note[]>([
    { id: 'd1', text: 'Init repo' }
  ]);
  const [newNote, setNewNote] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<'todo' | 'inProgress' | 'done'>('todo');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<'todo' | 'inProgress' | 'done' | null>(null);
  const [editingText, setEditingText] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = { id: `n-${Date.now()}`, text: newNote.trim() };
    if (selectedColumn === 'todo') setTodo((s) => [note, ...s]);
    if (selectedColumn === 'inProgress') setInProgress((s) => [note, ...s]);
    if (selectedColumn === 'done') setDone((s) => [note, ...s]);
    setNewNote('');
  };

  const startEdit = (col: 'todo' | 'inProgress' | 'done', id: string, currentText: string) => {
    setEditingId(id);
    setEditingColumn(col);
    setEditingText(currentText);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingColumn(null);
    setEditingText('');
  };

  const saveEdit = () => {
    if (!editingId || !editingColumn) return;
    const apply = (arr: Note[]) => arr.map((n) => (n.id === editingId ? { ...n, text: editingText.trim() } : n));
    if (editingColumn === 'todo') setTodo((s) => apply(s));
    if (editingColumn === 'inProgress') setInProgress((s) => apply(s));
    if (editingColumn === 'done') setDone((s) => apply(s));
    cancelEdit();
  };

  const handleKeyEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const deleteNote = (col: 'todo' | 'inProgress' | 'done', id: string) => {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;
    if (col === 'todo') setTodo((s) => s.filter((n) => n.id !== id));
    if (col === 'inProgress') setInProgress((s) => s.filter((n) => n.id !== id));
    if (col === 'done') setDone((s) => s.filter((n) => n.id !== id));
    if (editingId === id) cancelEdit();
  };

  const renderNote = (col: 'todo' | 'inProgress' | 'done', n: Note) => {
    const isEditing = editingId === n.id && editingColumn === col;
    return (
      <div key={n.id} className="group relative p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={handleKeyEdit}
                  autoFocus
                  className={`w-full border px-2 py-1 rounded text-sm focus:outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
                <button
                  onClick={saveEdit}
                  className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
                  aria-label="Save note"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className={`text-sm px-2 py-1 border rounded ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
                  }`}
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded text-sm break-words ${
                darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'
              }`}>
                {n.text}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={() => startEdit(col, n.id, n.text)}
                title="Edit note"
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                aria-label="Edit note"
              >
                <Edit3 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => deleteNote(col, n.id)}
                title="Delete note"
                className="p-1 rounded hover:bg-red-100"
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className={`absolute right-0 -top-5 opacity-0 group-hover:opacity-100 transition-opacity text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Edit Notes
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div className="p-4 sm:p-6 lg:p-12 overflow-auto flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>Team Notes</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value as any)}
            className={`border rounded px-2 py-1 text-sm ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
            }`}
          >
            <option value="todo">To Do</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add note..."
            className={`border rounded px-2 py-1 text-sm ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addNote();
            }}
          />
          <button onClick={addNote} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm min-h-[120px]`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${darkMode ? 'text-white' : ''}`}>To Do</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100'
            }`}>
              {todo.length}
            </span>
          </div>
          <div className="space-y-3">
            {todo.map((n) => (
              <div key={n.id} className="group">
                {renderNote('todo', n)}
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm min-h-[120px]`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${darkMode ? 'text-white' : ''}`}>In Progress</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100'
            }`}>
              {inProgress.length}
            </span>
          </div>
          <div className="space-y-3">
            {inProgress.map((n) => (
              <div key={n.id} className="group">
                {renderNote('inProgress', n)}
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm min-h-[120px]`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${darkMode ? 'text-white' : ''}`}>Done</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100'
            }`}>
              {done.length}
            </span>
          </div>
          <div className="space-y-3">
            {done.map((n) => (
              <div key={n.id} className="group">
                {renderNote('done', n)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamNotes;