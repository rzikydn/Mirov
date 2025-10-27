// src/components/dashboards/DatabaseTable.tsx (Enhanced with Share & Export + Date Icon Fix)

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Smile, FileText, Edit3, Calendar, Hash, Type, CheckSquare, ChevronDown, X, Download } from 'lucide-react';
import { Database, DatabaseRow } from '../../types/database';
import { propertyTypes } from '../../constants/dashboard';
import AddPropertyModal from './modals/AddPropertyModal';
import DeleteModal from './modals/DeleteModal';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api/databases';

interface DatabaseTableProps {
  database: Database;
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
  darkMode: boolean;
}

// Property type icons mapping
const propertyTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="w-3 h-3" />,
  number: <Hash className="w-3 h-3" />,
  date: <Calendar className="w-3 h-3" />,
  checkbox: <CheckSquare className="w-3 h-3" />,
};

// CSS for date input calendar icon
const dateInputStyles = `
  /* Custom styles for date input in dark mode */
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0);
    opacity: 0.6;
    cursor: pointer;
  }
  
  input[type="date"].dark-mode::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.8;
  }
  
  input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;

// Export Modal Component
const ExportModal: React.FC<{
  show: boolean;
  darkMode: boolean;
  database: Database;
  onClose: () => void;
}> = ({ show, darkMode, database, onClose }) => {
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(database, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${database.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportXLSX = () => {
    // Create CSV content (simplified XLSX export)
    let csv = '';
    
    // Header row
    csv += database.columns.map(col => `"${col.label}"`).join(',') + '\n';
    
    // Data rows
    database.rows.forEach(row => {
      const rowData = database.columns.map(col => {
        const prop = row.properties[col.key];
        if (!prop) return '""';
        
        if (prop.type === 'checkbox') {
          return prop.value ? '"Yes"' : '"No"';
        }
        
        const value = String(prop.value || '');
        return `"${value.replace(/"/g, '""')}"`;
      });
      csv += rowData.join(',') + '\n';
    });
    
    // Create download
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${database.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
        } rounded-lg shadow-xl w-full max-w-md`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Export Database
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Choose export format for "{database.name}"
          </p>

          {/* Export Options */}
          <button
            onClick={handleExportXLSX}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-[#1a1a1a] border-gray-700 hover:bg-gray-800' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Export as CSV/Excel
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Compatible with Excel, Google Sheets
                </p>
              </div>
            </div>
            <Download className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>

          <button
            onClick={handleExportJSON}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-[#1a1a1a] border-gray-700 hover:bg-gray-800' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Export as JSON
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Raw data format for developers
                </p>
              </div>
            </div>
            <Download className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
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
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Emoji Picker Component with Categories
const EmojiPicker: React.FC<{
  darkMode: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ darkMode, onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const emojiCategories = {
    smileys: {
      label: '😊 Smileys',
      emojis: [
        '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
        '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
        '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩',
        '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      ]
    },
    nature: {
      label: '🌿 Nature',
      emojis: [
        '🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🥀', '🌾', '🌱', '🌿',
        '🍀', '🍁', '🍂', '🍃', '🌳', '🌲', '🌴', '🌵', '🌊', '🌬️',
        '🌀', '🌈', '⭐', '🌟', '✨', '⚡', '☀️', '🌤️', '⛅', '🌥️',
        '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '❄️', '☃️', '⛄', '🌙', '🌎',
        '🌍', '🌏', '🪐', '💫', '🔥', '💧', '🌊', '🏔️', '⛰️', '🌋',
      ]
    },
    food: {
      label: '🍕 Food',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒',
        '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯',
        '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓',
        '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆',
      ]
    },
    activity: {
      label: '⚽ Activity',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
        '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
        '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴',
      ]
    },
    travel: {
      label: '✈️ Travel',
      emojis: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
        '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵',
        '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
        '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
        '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🛸', '🚀',
      ]
    },
    objects: {
      label: '💼 Objects',
      emojis: [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
        '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
        '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
        '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
        '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
      ]
    },
    symbols: {
      label: '❤️ Symbols',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
        '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️',
        '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
        '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴',
      ]
    },
    flags: {
      label: '🏁 Flags',
      emojis: [
        '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩',
        '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸',
        '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫',
        '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷',
        '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫',
      ]
    },
  };

  const filteredEmojis = () => {
    if (!searchQuery) {
      return emojiCategories[activeCategory as keyof typeof emojiCategories].emojis;
    }
    
    // Search across all categories
    return Object.values(emojiCategories)
      .flatMap(cat => cat.emojis)
      .filter(emoji => emoji.includes(searchQuery));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute top-full left-0 mt-2 ${
        darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
      } rounded-lg shadow-xl border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      } z-50 w-80`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Choose an emoji
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-3 py-2 rounded text-sm ${
            darkMode 
              ? 'bg-[#1a1a1a] text-gray-300 placeholder-gray-500 border-gray-700' 
              : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200'
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className={`flex gap-1 px-2 py-2 border-b overflow-x-auto ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                activeCategory === key
                  ? darkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-900'
                  : darkMode 
                    ? 'text-gray-400 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.label.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-3">
        <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
          {filteredEmojis().map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={`text-2xl p-2 rounded hover:bg-opacity-80 transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {filteredEmojis().length === 0 && (
          <div className={`text-center py-8 text-sm ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            No emoji found
          </div>
        )}
      </div>
    </div>
  );
};

// Type Change Dropdown Component
const TypeChangeDropdown: React.FC<{
  currentType: string;
  darkMode: boolean;
  onTypeChange: (type: string) => void;
  onClose: () => void;
}> = ({ currentType, darkMode, onTypeChange, onClose }) => {
  const types = [
    { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div className={`absolute top-full left-0 mt-1 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} py-1 z-50 min-w-[150px]`}>
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => {
            onTypeChange(type.value);
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
            currentType === type.value
              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
              : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {type.icon}
          {type.label}
        </button>
      ))}
    </div>
  );
};

const DatabaseTable: React.FC<DatabaseTableProps> = ({
  database,
  setDatabases,
  darkMode,
}) => {
  const { canManageSchedules } = useAuth();

  // Check if user can edit (ADMIN or SUPERUSER)
  const canEdit = canManageSchedules();

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'row' | 'column'; id: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(database.name);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<string | null>(null);
  const newRowRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const newColumnRef = useRef<HTMLTableHeaderCellElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(database.description || '');
  const [showExportModal, setShowExportModal] = useState(false);

  // Inject styles for date input calendar icon
  useEffect(() => {
    const styleId = 'date-input-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = dateInputStyles;
      document.head.appendChild(style);
    }
  }, []);

  const { token } = useAuth();

  const getAuthHeaders = () => {
    const authToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    };
  };

  const updateThisDb = async (mutator: (db: Database) => Database) => {
    const updatedDb = mutator(database);

    // Update local state immediately for responsive UI
    setDatabases((prev) => prev.map((d) => (d.id === database.id ? updatedDb : d)));

    // Sync with backend if database has a numeric ID (already saved)
    if (typeof updatedDb.id === 'number') {
      try {
        const response = await fetch(`${API_URL}/${updatedDb.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: updatedDb.name,
            description: updatedDb.description,
            icon: updatedDb.icon,
            columns: updatedDb.columns,
            rows: updatedDb.rows
          })
        });

        if (!response.ok) {
          console.error('Failed to sync database with backend');
        }
      } catch (error) {
        console.error('Error syncing database:', error);
      }
    }
  };

  const handleColumnLabelChange = (key: string, value: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c))
    }));
  };

  const handleColumnTypeChange = (key: string, type: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, type } : c)),
      rows: db.rows.map((row) => ({
        ...row,
        properties: {
          ...row.properties,
          [key]: { value: row.properties[key]?.value || '', type }
        },
      })),
    }));
  };

  const handleValueChange = (rowId: string, key: string, value: any) => {
    // Block if user cannot edit
    if (!canEdit) return;

    updateThisDb((db) => ({
      ...db,
      rows: db.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              properties: {
                ...row.properties,
                [key]: { ...row.properties[key], value }
              }
            }
          : row
      ),
    }));
  };

  const handleAddProperty = (name: string, type: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    const newKey = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    updateThisDb((db) => {
      const updatedColumns = [...db.columns, { key: newKey, label: name, type }];
      const updatedRows = db.rows.map((row) => ({
        ...row,
        properties: { ...row.properties, [newKey]: { value: '', type } }
      }));
      return { ...db, columns: updatedColumns, rows: updatedRows };
    });
    setShowAddProperty(false);
    
    setTimeout(() => {
      if (tableContainerRef.current && newColumnRef.current) {
        const container = tableContainerRef.current;
        const column = newColumnRef.current;
        const scrollLeft = column.offsetLeft - container.offsetWidth + column.offsetWidth + 50;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDeleteProperty = (key: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    setDeleteTarget({ type: 'column', id: key });
    setShowConfirmDelete(true);
  };

  const handleDeleteRow = (rowId: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    setDeleteTarget({ type: 'row', id: rowId });
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    // Block if user cannot edit
    if (!canEdit) return;

    if (!deleteTarget) return;
    if (deleteTarget.type === 'column') {
      updateThisDb((db) => {
        const updatedColumns = db.columns.filter((c) => c.key !== deleteTarget.id);
        const updatedRows = db.rows.map((row) => {
          const newProps = { ...row.properties };
          delete newProps[deleteTarget.id];
          return { ...row, properties: newProps };
        });
        return { ...db, columns: updatedColumns, rows: updatedRows };
      });
    } else {
      updateThisDb((db) => ({ 
        ...db, 
        rows: db.rows.filter((r) => r.id !== deleteTarget.id) 
      }));
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleAddRow = () => {
    // Block if user cannot edit
    if (!canEdit) {
      alert('You do not have permission to add rows. Only ADMIN and SUPERUSER can edit.');
      return;
    }

    const newRow: DatabaseRow = {
      id: `row-${Date.now()}`,
      properties: Object.fromEntries(
        database.columns.map((col) => [col.key, { value: '', type: col.type }])
      ),
    };
    updateThisDb((db) => ({ ...db, rows: [...db.rows, newRow] }));

    setTimeout(() => {
      newRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDatabaseNameChange = () => {
    // Block if user cannot edit
    if (!canEdit) return;

    if (editedName.trim() && editedName !== database.name) {
      updateThisDb((db) => ({ ...db, name: editedName.trim() }));
    } else {
      setEditedName(database.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDatabaseNameChange();
    if (e.key === 'Escape') {
      setEditedName(database.name);
      setIsEditingName(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    // Block if user cannot edit
    if (!canEdit) return;

    // Add emoji to the beginning of the name
    const newName = database.icon
      ? database.name.replace(database.icon, emoji)
      : `${emoji} ${database.name}`;
    updateThisDb((db) => ({ ...db, name: newName, icon: emoji }));
    setEditedName(newName);
  };

  const handleRemoveIcon = () => {
    // Block if user cannot edit
    if (!canEdit) return;

    // Remove emoji from the name
    if (database.icon) {
      const newName = database.name.replace(database.icon, '').trim();
      updateThisDb((db) => ({ ...db, name: newName, icon: undefined }));
      setEditedName(newName);
    }
  };

  const handleDescriptionChange = () => {
    // Block if user cannot edit
    if (!canEdit) return;

    updateThisDb((db) => ({ ...db, description: editedDescription.trim() }));
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditedDescription(database.description || '');
      setIsEditingDescription(false);
    }
  };

  const handleAddDescription = () => {
    // Block if user cannot edit
    if (!canEdit) return;

    setIsEditingDescription(true);
    setEditedDescription(database.description || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full overflow-auto ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}
    >
      {/* Header - Notion Style */}
      <div className="px-8 sm:px-12 lg:px-24 pt-12 pb-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Smile className="w-4 h-4" />
                {database.icon ? 'Change icon' : 'Add icon'}
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  darkMode={darkMode}
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
          )}

          {canEdit && !database.description && (
            <button
              onClick={handleAddDescription}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Add description
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
              darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          {/* Title with Icon (Inline) */}
          {isEditingName ? (
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleDatabaseNameChange}
              onKeyDown={handleNameKeyPress}
              autoFocus
              className={`text-4xl font-bold w-full ${
                darkMode ? 'bg-[#191919] text-white' : 'bg-white text-gray-900'
              } border-0 focus:outline-none p-0`}
              placeholder="Untitled"
            />
          ) : (
            <div className="flex items-center gap-3 group">
              <h1
                onClick={() => canEdit && setIsEditingName(true)}
                className={`text-4xl font-bold ${canEdit ? 'cursor-text' : 'cursor-default'} ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {database.name}
              </h1>
              {canEdit && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                  title="Edit title"
                >
                  <Edit3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              )}
              {canEdit && database.icon && (
                <button
                  onClick={handleRemoveIcon}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-opacity ${
                    darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Remove icon"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Description Section */}
          {(database.description || isEditingDescription) && (
            <div className="mt-4">
              {isEditingDescription ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={handleDescriptionChange}
                  onKeyDown={handleDescriptionKeyPress}
                  autoFocus
                  placeholder="Add a description..."
                  rows={3}
                  className={`w-full text-base ${
                    darkMode ? 'bg-[#191919] text-gray-400' : 'bg-white text-gray-600'
                  } border-0 focus:outline-none p-0 resize-none`}
                />
              ) : (
                <div className="flex items-start gap-3 group">
                  <p
                    onClick={() => {
                      if (canEdit) {
                        setIsEditingDescription(true);
                        setEditedDescription(database.description || '');
                      }
                    }}
                    className={`text-base ${canEdit ? 'cursor-text' : 'cursor-default'} ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {database.description}
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditingDescription(true);
                        setEditedDescription(database.description || '');
                      }}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Edit description"
                    >
                      <Edit3 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-sm`}></div>
              <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-sm`}></div>
              <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-sm`}></div>
              <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-400'} rounded-sm`}></div>
            </div>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Table
            </span>
          </div>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            + New Rows
          </button>
        </div>
      </div>

      {/* Table - Notion Style with Scroll */}
      <div className="px-8 sm:px-12 lg:px-24 pb-12">
        <div className={`border rounded-lg overflow-hidden ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {/* Scrollable container - only horizontal scroll here */}
          <div className="overflow-x-auto" ref={tableContainerRef}>
            <table className="w-full">
              {/* Table Header - Sticky */}
              <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-[#202020]' : 'bg-gray-50'}`}>
                <tr>
                  {database.columns.map((col, index) => (
                    <th
                      key={col.key}
                      ref={index === database.columns.length - 1 ? newColumnRef : null}
                      className={`text-left px-4 py-2 font-normal ${
                        index === 0 ? 'min-w-[320px]' : 'min-w-[200px]'
                      }`}
                    >
                      <div className="flex items-center gap-2 group">
                        {/* Type Icon with Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setTypeDropdownOpen(typeDropdownOpen === col.key ? null : col.key)}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                          >
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {propertyTypeIcons[col.type] || propertyTypeIcons.text}
                            </span>
                            <ChevronDown className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </button>
                          {typeDropdownOpen === col.key && (
                            <TypeChangeDropdown
                              currentType={col.type}
                              darkMode={darkMode}
                              onTypeChange={(type) => handleColumnTypeChange(col.key, type)}
                              onClose={() => setTypeDropdownOpen(null)}
                            />
                          )}
                        </div>
                        
                        {/* Column Label */}
                        <input
                          value={col.label}
                          onChange={(e) => canEdit && handleColumnLabelChange(col.key, e.target.value)}
                          disabled={!canEdit}
                          className={`text-sm font-medium ${
                            darkMode ? 'text-gray-300 bg-transparent' : 'text-gray-700 bg-transparent'
                          } border-0 focus:outline-none px-0 py-0 flex-1 ${!canEdit ? 'cursor-not-allowed' : ''}`}
                          placeholder="Name"
                        />

                        {/* Delete Button - Only for ADMIN/SUPERUSER */}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteProperty(col.key)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                          >
                            <MoreHorizontal className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {/* Add Property Button - Only for ADMIN/SUPERUSER */}
                  {canEdit && (
                    <th className="w-12 sticky right-0">
                      <button
                        onClick={() => setShowAddProperty(true)}
                        className={`p-1 rounded ${
                          darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                        }`}
                        title="Add property"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className={`${darkMode ? 'divide-gray-800' : 'divide-gray-200'} divide-y`}>
                {database.rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    ref={rowIndex === database.rows.length - 1 ? newRowRef : null}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`group ${
                      darkMode ? 'hover:bg-[#202020]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {database.columns.map((col) => {
                      const prop = row.properties[col.key];
                      if (!prop) return <td key={col.key} className="px-4 py-3"></td>;

                      return (
                        <td key={col.key} className="px-4 py-3">
                          {prop.type === 'text' && (
                            <input
                              type="text"
                              value={prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                              disabled={!canEdit}
                              placeholder="Empty"
                              className={`w-full text-sm ${
                                darkMode
                                  ? 'bg-transparent text-gray-300 placeholder-gray-600'
                                  : 'bg-transparent text-gray-900 placeholder-gray-400'
                              } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          )}
                          {prop.type === 'number' && (
                            <input
                              type="number"
                              value={prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.valueAsNumber)}
                              disabled={!canEdit}
                              placeholder="0"
                              className={`w-full text-sm ${
                                darkMode
                                  ? 'bg-transparent text-gray-300 placeholder-gray-600'
                                  : 'bg-transparent text-gray-900 placeholder-gray-400'
                              } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          )}
                          {prop.type === 'date' && (
                            <input
                              type="date"
                              value={prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                              disabled={!canEdit}
                              className={`w-full text-sm ${
                                darkMode
                                  ? 'bg-transparent text-gray-300 dark-mode'
                                  : 'bg-transparent text-gray-900'
                              } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          )}
                          {prop.type === 'checkbox' && (
                            <input
                              type="checkbox"
                              checked={!!prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.checked)}
                              disabled={!canEdit}
                              className={`w-4 h-4 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 sticky right-0">
                      {canEdit && hoveredRow === row.id && (
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className={`p-1 rounded ${
                            darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    </tr>
                ))}

                {/* New Page Row - Only for ADMIN/SUPERUSER */}
                <tr className={darkMode ? 'hover:bg-[#202020]' : 'hover:bg-gray-50'}>
                  <td colSpan={database.columns.length + 1} className="px-4 py-3">
                    {canEdit ? (
                      <button
                        onClick={handleAddRow}
                        className={`flex items-center gap-2 text-sm ${
                          darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        New rows
                      </button>
                    ) : (
                      <span className={`text-sm italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        View only - No edit permission
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPropertyModal
        show={showAddProperty}
        darkMode={darkMode}
        onAdd={handleAddProperty}
        onCancel={() => setShowAddProperty(false)}
      />

      <DeleteModal
        show={showConfirmDelete}
        darkMode={darkMode}
        title={`Delete ${deleteTarget?.type === 'column' ? 'column' : 'row'}?`}
        message={`Are you sure you want to delete this ${deleteTarget?.type}?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <ExportModal
        show={showExportModal}
        darkMode={darkMode}
        database={database}
        onClose={() => setShowExportModal(false)}
      />
    </motion.div>
  );
};

export default DatabaseTable;