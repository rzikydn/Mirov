// src/components/dashboards/DateInput.tsx
// Custom date input component with Indonesian format display

import React, { useState, useRef, useEffect } from 'react';
import { formatDateIndonesian } from '../../utils/dateFormatUtils';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
  disabled?: boolean;
  darkMode: boolean;
  highlightColor?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  darkMode,
  highlightColor
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format display value
  const displayValue = value ? formatDateIndonesian(value) : '';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsPickerOpen(false);
  };

  const handleDisplayClick = () => {
    if (!disabled) {
      setIsPickerOpen(true);
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 0);
    }
  };

  const handlePickerBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsPickerOpen(false);
    if (onBlur) {
      onBlur(e.target.value);
    }
  };

  return (
    <div className="relative w-full">
      {/* Display Input - Shows Indonesian format */}
      <div
        onClick={handleDisplayClick}
        className={`flex items-center gap-2 w-full text-sm ${
          highlightColor && darkMode
            ? 'bg-transparent text-gray-900'
            : darkMode
              ? 'bg-transparent text-gray-300'
              : 'bg-transparent text-gray-900'
        } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      >
        <span className="flex-1">{displayValue || ''}</span>
        <Calendar className={`w-4 h-4 flex-shrink-0 ${
          highlightColor && darkMode
            ? 'text-gray-700'
            : darkMode
              ? 'text-gray-400'
              : 'text-gray-500'
        }`} />
      </div>

      {/* Hidden Date Picker */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={handleDateChange}
        onFocus={onFocus}
        onBlur={handlePickerBlur}
        disabled={disabled}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        style={{ pointerEvents: isPickerOpen ? 'auto' : 'none' }}
      />
    </div>
  );
};

export default DateInput;
