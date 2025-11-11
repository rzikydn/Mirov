// src/components/dashboards/TypeChangeDropdown.tsx
// Dropdown for changing column data type

import React from 'react';
import { Type, Hash, Calendar, CheckSquare } from 'lucide-react';

interface TypeChangeDropdownProps {
  currentType: string;
  darkMode: boolean;
  onTypeChange: (type: string) => void;
  onClose: () => void;
}

const TypeChangeDropdown: React.FC<TypeChangeDropdownProps> = ({
  currentType,
  darkMode,
  onTypeChange,
  onClose
}) => {
  const types = [
    { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div className={`absolute top-full left-0 mt-1 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} rounded-lg shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} py-1 min-w-[150px]`} style={{ zIndex: 10000 }}>
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

export default TypeChangeDropdown;
