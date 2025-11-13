// src/components/dashboards/EmojiPicker.tsx
// Emoji picker component with categories

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { emojiCategories } from '../../constants/emojis';

interface EmojiPickerProps {
  darkMode: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ darkMode, onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const pickerRef = useRef<HTMLDivElement>(null);

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
      } rounded-xl shadow-2xl border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      } z-50 w-[380px]`}
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

      {/* Category Tabs */}
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

      {/* Emoji Grid */}
      <div className="p-2">
        <div className="grid grid-cols-9 gap-0 max-h-72 overflow-y-auto custom-scrollbar">
          {emojiCategories[activeCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={`text-3xl w-10 h-10 flex items-center justify-center rounded-md transition-all transform hover:scale-110 ${
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
