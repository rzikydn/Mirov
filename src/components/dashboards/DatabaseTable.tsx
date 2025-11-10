// src/components/dashboards/DatabaseTable.tsx (Refactored with modular components)

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Smile, FileText, Edit3, ChevronDown, X, Download, ArrowUpDown } from 'lucide-react';
import { Database, DatabaseRow } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';

// Import modular components
import EmojiPicker from './EmojiPicker';
import TypeChangeDropdown from './TypeChangeDropdown';
import SortDropdown from './SortDropdown';
import AddPropertyModal from './modals/AddPropertyModal';
import DeleteModal from './modals/DeleteModal';
import ExportModal from './modals/ExportModal';

// Import constants
import { propertyTypeIcons } from '../../constants/propertyTypeIcons';
import { dateInputStyles } from '../../styles/dateInputStyles';

// Import utilities
import { SortConfig, getSortedRows, addSort, updateSortDirection, deleteSort, clearAllSorts } from '../../utils/sortingUtils';
import { updateDatabase } from '../../utils/databaseUtils';

interface DatabaseTableProps {
  database: Database;
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
  darkMode: boolean;
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({
  database,
  setDatabases,
  darkMode,
}) => {
  const { canManageSchedules, user, token } = useAuth();
  const { addHistory } = useHistory();

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
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  const updateThisDb = async (mutator: (db: Database) => Database) => {
    const updatedDb = mutator(database);

    // Update local state immediately for responsive UI
    setDatabases((prev) => prev.map((d) => (d.id === database.id ? updatedDb : d)));

    // Sync with backend if database has a numeric ID (already saved)
    if (typeof updatedDb.id === 'number') {
      await updateDatabase(
        updatedDb,
        token,
        user ? addHistory : undefined,
        user?.name,
        user?.role as 'SUPERUSER' | 'ADMIN' | 'UMUM'
      );
    }
  };

  const handleColumnLabelChange = (key: string, value: string) => {
    if (!canEdit) return;

    updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c))
    }));
  };

  const handleColumnTypeChange = (key: string, type: string) => {
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
    if (!canEdit) return;

    setDeleteTarget({ type: 'column', id: key });
    setShowConfirmDelete(true);
  };

  const handleDeleteRow = (rowId: string) => {
    if (!canEdit) return;

    setDeleteTarget({ type: 'row', id: rowId });
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
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

  // Sort handlers using utility functions
  const handleAddSort = (columnKey: string) => {
    setSortConfig(addSort(sortConfig, columnKey));
  };

  const handleUpdateSortDirection = (index: number, direction: 'asc' | 'desc') => {
    setSortConfig(updateSortDirection(sortConfig, index, direction));
  };

  const handleDeleteSort = (index: number) => {
    setSortConfig(deleteSort(sortConfig, index));
  };

  const handleClearAllSorts = () => {
    setSortConfig(clearAllSorts());
  };

  const handleDatabaseNameChange = () => {
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
    if (!canEdit) return;

    const newName = database.icon
      ? database.name.replace(database.icon, emoji)
      : `${emoji} ${database.name}`;
    updateThisDb((db) => ({ ...db, name: newName, icon: emoji }));
    setEditedName(newName);
  };

  const handleRemoveIcon = () => {
    if (!canEdit) return;

    if (database.icon) {
      const newName = database.name.replace(database.icon, '').trim();
      updateThisDb((db) => ({ ...db, name: newName, icon: undefined }));
      setEditedName(newName);
    }
  };

  const handleDescriptionChange = () => {
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
    if (!canEdit) return;

    setIsEditingDescription(true);
    setEditedDescription(database.description || '');
  };

  // Get sorted rows using utility function
  const sortedRows = getSortedRows(database.rows, database.columns, sortConfig);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full overflow-auto hide-scrollbar ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}
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

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium border ${
                  sortConfig.length > 0
                    ? darkMode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Sort{sortConfig.length > 0 ? ` (${sortConfig.length})` : ''}</span>
              </button>

              {/* Sort Dropdown Component */}
              {showSortDropdown && (
                <SortDropdown
                  darkMode={darkMode}
                  sortConfig={sortConfig}
                  columns={database.columns}
                  onAddSort={handleAddSort}
                  onUpdateDirection={handleUpdateSortDirection}
                  onDeleteSort={handleDeleteSort}
                  onClearAll={handleClearAllSorts}
                  onClose={() => setShowSortDropdown(false)}
                />
              )}
            </div>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + New Rows
            </button>
          </div>
        </div>
      </div>

      {/* Table - Notion Style with Scroll */}
      <div className="px-8 sm:px-12 lg:px-24 pb-12">
        <div className={`border rounded-lg overflow-hidden ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {/* Scrollable container - only horizontal scroll here */}
          <div className="overflow-x-auto hide-scrollbar" ref={tableContainerRef}>
            <table className="w-full">
              {/* Table Header - Sticky */}
              <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-[#202020]' : 'bg-gray-50'}`}>
                <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  {database.columns.map((col, index) => (
                    <th
                      key={col.key}
                      ref={index === database.columns.length - 1 ? newColumnRef : null}
                      className={`text-left py-2 font-normal ${
                        index !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                      }`}
                      style={{
                        padding: col.type === 'date'
                          ? (index === 0 ? '0.5rem 0.125rem 0.5rem 0.75rem' : '0.5rem 0.125rem')
                          : (index === 0 ? '0.5rem 0.5rem 0.5rem 0.75rem' : '0.5rem 0.5rem'),
                        minWidth: 'fit-content',
                        width: 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {/* Date column optimized for compact view */}
                      <div className={`flex items-center group ${index === 0 ? 'gap-0' : 'gap-0.5'}`}>
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
                    <th className={`w-12 sticky right-0 z-20 border-b ${darkMode ? 'bg-[#202020] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
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
                {sortedRows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    ref={rowIndex === sortedRows.length - 1 ? newRowRef : null}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`group ${
                      darkMode ? 'hover:bg-[#202020]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {database.columns.map((col, colIndex) => {
                      const prop = row.properties[col.key];
                      if (!prop) return <td
                        key={col.key}
                        className={`py-2 ${
                          colIndex !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                        }`}
                        style={{
                          padding: col.type === 'date'
                            ? (colIndex === 0 ? '0.5rem 0.125rem 0.5rem 0.75rem' : '0.5rem 0.125rem')
                            : (colIndex === 0 ? '0.5rem 0.5rem 0.5rem 0.75rem' : '0.5rem 0.5rem'),
                          whiteSpace: 'nowrap'
                        }}
                      ></td>;

                      return (
                        <td
                          key={col.key}
                          className={`py-2 ${
                            colIndex !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                          }`}
                          style={{
                            padding: col.type === 'date'
                              ? (colIndex === 0 ? '0.5rem 0.125rem 0.5rem 0.75rem' : '0.5rem 0.125rem')
                              : (colIndex === 0 ? '0.5rem 0.5rem 0.5rem 0.75rem' : '0.5rem 0.5rem'),
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {prop.type === 'text' && (
                            <input
                              type="text"
                              value={prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                              disabled={!canEdit}
                              placeholder=""
                              className={`w-full text-sm ${
                                darkMode
                                  ? 'bg-transparent text-gray-300'
                                  : 'bg-transparent text-gray-900'
                              } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                          )}
                          {prop.type === 'number' && (
                            <input
                              type="number"
                              value={prop.value}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.valueAsNumber)}
                              disabled={!canEdit}
                              placeholder=""
                              className={`w-full text-sm ${
                                darkMode
                                  ? 'bg-transparent text-gray-300'
                                  : 'bg-transparent text-gray-900'
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
                              style={{ paddingRight: 0, maxWidth: '110px' }}
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
