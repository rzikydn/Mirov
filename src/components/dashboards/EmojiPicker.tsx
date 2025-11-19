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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside picker AND outside the emoji button container
      const emojiButtonContainer = document.getElementById('emoji-button-container');
      const clickedInsideButton = emojiButtonContainer?.contains(event.target as Node);
      const clickedInsidePicker = pickerRef.current?.contains(event.target as Node);

      if (!clickedInsidePicker && !clickedInsideButton) {
        onClose();
      }
    };

    // Add delay to prevent immediate closing when picker first opens
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Calculate position on mount - WITH FADE IN
  useEffect(() => {
    if (pickerRef.current) {
      const container = document.getElementById('emoji-button-container');
      const button = container?.querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const pickerWidth = 380;
        const pickerHeight = 400; // approximate height

        let left = rect.left;
        let top = rect.bottom + 8;

        // Adjust if picker would go off screen horizontally
        if (left + pickerWidth > viewportWidth) {
          left = viewportWidth - pickerWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        // Adjust if picker would go off screen vertically
        if (top + pickerHeight > viewportHeight) {
          top = rect.top - pickerHeight - 8;
        }

        setPosition({ top, left });
        // Delay visibility to prevent glitch
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    }
  }, []);

  return (
    <div
      ref={pickerRef}
      className={`fixed ${
        darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
      } rounded-xl shadow-2xl border ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      } z-[200] w-[380px] max-w-[calc(100vw-2rem)] transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
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
