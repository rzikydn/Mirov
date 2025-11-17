// src/components/dashboards/SortDropdown.tsx
// Multi-level sort dropdown component (Notion-style)

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { DatabaseColumn } from '../../types/database';
import { SortConfig } from '../../utils/sortingUtils';
import { propertyTypeIcons } from '../../constants/propertyTypeIcons';

interface SortDropdownProps {
  darkMode: boolean;
  sortConfig: SortConfig[];
  columns: DatabaseColumn[];
  onAddSort: (columnKey: string) => void;
  onUpdateDirection: (index: number, direction: 'asc' | 'desc') => void;
  onDeleteSort: (index: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  darkMode,
  sortConfig,
  columns,
  onAddSort,
  onUpdateDirection,
  onDeleteSort,
  onClearAll,
  onClose
}) => {
  const [showAddSortDropdown, setShowAddSortDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const addSortButtonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full mt-2 rounded-lg shadow-lg border z-50
        w-80 max-w-[calc(100vw-2rem)]
        left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0
        ${darkMode ? 'bg-[#2a2a2a] border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      {/* Existing Sorts */}
      {sortConfig.length > 0 && (
        <div className="p-2">
          {sortConfig.map((sort, index) => {
            const column = columns.find(col => col.key === sort.column);
            if (!column) return null;

            return (
              <div
                key={index}
                className={`flex items-center gap-1 sm:gap-2 ${index < sortConfig.length - 1 ? 'mb-2' : ''} p-1.5 sm:p-2 rounded ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                {/* Column Selector */}
                <div className="relative flex-1 min-w-0">
                  <div
                    className={`w-full flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded border text-xs sm:text-sm ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-gray-300'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`}>
                      {propertyTypeIcons[column.type]}
                    </span>
                    <span className="flex-1 text-left truncate">{column.label}</span>
                  </div>
                </div>

                {/* Direction Selector */}
                <select
                  value={sort.direction}
                  onChange={(e) => onUpdateDirection(index, e.target.value as 'asc' | 'desc')}
                  className={`px-2 sm:px-3 py-1.5 rounded border text-xs sm:text-sm cursor-pointer flex-shrink-0 ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-300'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteSort(index)}
                  className={`p-1.5 rounded flex-shrink-0 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                  title="Delete sort"
                >
                  <Trash2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Sort Button */}
      <div className={`p-2 ${sortConfig.length > 0 ? 'border-t' : ''} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="relative">
          <button
            ref={addSortButtonRef}
            onClick={() => {
              if (!showAddSortDropdown && addSortButtonRef.current) {
                const rect = addSortButtonRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let leftPosition;
                let topPosition;

                if (viewportWidth < 640) { // mobile (sm breakpoint)
                  // Center vertically on viewport
                  topPosition = (viewportHeight - 192) / 2; // 192px = max-h-48 (12rem)
                  // Center horizontally: left position is 1rem, width will be calc(100vw-2rem)
                  leftPosition = 16; // 1rem from left (16px)
                } else {
                  // Desktop: align to button
                  const maxDropdownWidth = 320; // w-80
                  leftPosition = Math.max(16, rect.right - maxDropdownWidth);
                  topPosition = rect.bottom + window.scrollY + 4;
                }

                setDropdownPosition({
                  top: topPosition,
                  left: leftPosition
                });
              }
              setShowAddSortDropdown(!showAddSortDropdown);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add sort</span>
          </button>

          {/* Column Selection Dropdown for Add Sort */}
          {showAddSortDropdown && (
            <div
              className={`fixed rounded-lg shadow-lg border max-h-48 overflow-y-auto custom-scrollbar
                ${darkMode ? 'bg-[#2a2a2a] border-gray-700' : 'bg-white border-gray-200'}
              `}
              style={{
                zIndex: 100,
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                right: window.innerWidth < 640 ? '16px' : 'auto',
                width: window.innerWidth >= 640 ? '320px' : 'auto'
              }}
            >
              {columns
                .filter(col => !sortConfig.find(s => s.column === col.key))
                .map((col) => (
                  <button
                    key={col.key}
                    onClick={() => {
                      onAddSort(col.key);
                      setShowAddSortDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {propertyTypeIcons[col.type]}
                    </span>
                    <span>{col.label}</span>
                  </button>
                ))}
              {columns.length === sortConfig.length && (
                <div className={`px-3 py-4 text-sm text-center ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  All columns are sorted
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete All Sorts */}
      {sortConfig.length > 0 && (
        <div className={`p-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => {
              onClearAll();
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
              darkMode
                ? 'hover:bg-gray-700 text-red-400'
                : 'hover:bg-gray-100 text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete sort</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
