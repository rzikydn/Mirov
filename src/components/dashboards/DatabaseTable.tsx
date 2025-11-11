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
import DateInput from './DateInput';

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

  // Check if user can manage columns (SUPERUSER only)
  const canManageColumns = user?.role === 'SUPERUSER';

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
  const [sortConfig, setSortConfig] = useState<SortConfig[]>(() => {
    // Set default sort to first column, ascending
    if (database.columns.length > 0) {
      return [{ column: database.columns[0].key, direction: 'asc' }];
    }
    return [];
  });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string; oldValue: any } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize default widths for each column
    const widths: Record<string, number> = {};
    database.columns.forEach((col) => {
      widths[col.key] = col.type === 'date' ? 180 : 150;
    });
    return widths;
  });
  const [resizingColumn, setResizingColumn] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

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

  // Handle column resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(80, resizingColumn.startWidth + diff);
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn.key]: newWidth
        }));
      }
    };

    const handleMouseUp = () => {
      if (resizingColumn) {
        setResizingColumn(null);
      }
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn]);

  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn({
      key: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey] || 150
    });
  };

  const updateThisDb = async (mutator: (db: Database) => Database) => {
    const updatedDb = mutator(database);

    // Update local state immediately for responsive UI
    setDatabases((prev) => prev.map((d) => (d.id === database.id ? updatedDb : d)));

    // Sync with backend if database has a numeric ID (already saved)
    // Note: We don't pass addHistory here anymore because we handle specific history entries in each handler
    if (typeof updatedDb.id === 'number') {
      await updateDatabase(
        updatedDb,
        token,
        undefined, // Don't use generic history
        user?.name,
        user?.role as 'SUPERUSER' | 'ADMIN' | 'UMUM'
      );
    }
  };

  const handleColumnLabelChange = async (key: string, value: string) => {
    if (!canEdit) return;

    const oldColumn = database.columns.find(c => c.key === key);
    const oldLabel = oldColumn?.label || '';

    await updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c))
    }));

    // Add specific history entry if column name actually changed
    if (oldLabel !== value && value.trim() && user) {
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'edit',
        target: 'database',
        targetName: database.name,
        description: `${user.name} renamed column "${oldLabel}" to "${value}" in database "${database.name}"`
      });
    }
  };

  const handleColumnTypeChange = async (key: string, type: string) => {
    if (!canEdit) return;

    const column = database.columns.find(c => c.key === key);
    const oldType = column?.type || '';
    const columnLabel = column?.label || '';

    await updateThisDb((db) => ({
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

    // Add specific history entry
    if (oldType !== type && user) {
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'edit',
        target: 'database',
        targetName: database.name,
        description: `${user.name} changed column "${columnLabel}" type from "${oldType}" to "${type}" in database "${database.name}"`
      });
    }
  };

  const handleCellFocus = (rowId: string, key: string, currentValue: any) => {
    // Store the initial value when user starts editing
    setEditingCell({ rowId, key, oldValue: currentValue });
  };

  const handleCellBlur = async (rowId: string, key: string, newValue: any) => {
    // When user finishes editing, check if value changed and add history
    if (editingCell && editingCell.rowId === rowId && editingCell.key === key) {
      const oldValue = editingCell.oldValue;
      if (oldValue !== newValue && user) {
        const column = database.columns.find(c => c.key === key);
        const columnLabel = column?.label || '';
        const rowIndex = database.rows.findIndex(r => r.id === rowId) + 1;

        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'edit',
          target: 'database',
          targetName: database.name,
          description: `${user.name} updated "${columnLabel}" in row ${rowIndex} from "${oldValue || '(empty)'}" to "${newValue || '(empty)'}" in database "${database.name}"`
        });
      }
      setEditingCell(null);
    }
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

  const handleAddProperty = async (name: string, type: string) => {
    if (!canEdit) return;

    const newKey = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    await updateThisDb((db) => {
      const updatedColumns = [...db.columns, { key: newKey, label: name, type }];
      const updatedRows = db.rows.map((row) => ({
        ...row,
        properties: { ...row.properties, [newKey]: { value: '', type } }
      }));
      return { ...db, columns: updatedColumns, rows: updatedRows };
    });

    // Add specific history entry
    if (user) {
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'added',
        target: 'database',
        targetName: database.name,
        description: `${user.name} added new column "${name}" (type: ${type}) to database "${database.name}"`
      });
    }

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

  const confirmDelete = async () => {
    if (!canEdit) return;

    if (!deleteTarget) return;
    if (deleteTarget.type === 'column') {
      const column = database.columns.find(c => c.key === deleteTarget.id);
      const columnLabel = column?.label || '';

      await updateThisDb((db) => {
        const updatedColumns = db.columns.filter((c) => c.key !== deleteTarget.id);
        const updatedRows = db.rows.map((row) => {
          const newProps = { ...row.properties };
          delete newProps[deleteTarget.id];
          return { ...row, properties: newProps };
        });
        return { ...db, columns: updatedColumns, rows: updatedRows };
      });

      // Add specific history entry for column deletion
      if (user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'delete',
          target: 'database',
          targetName: database.name,
          description: `${user.name} deleted column "${columnLabel}" from database "${database.name}"`
        });
      }
    } else {
      await updateThisDb((db) => ({
        ...db,
        rows: db.rows.filter((r) => r.id !== deleteTarget.id)
      }));

      // Add specific history entry for row deletion
      if (user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'delete',
          target: 'database',
          targetName: database.name,
          description: `${user.name} deleted a row from database "${database.name}"`
        });
      }
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleAddRow = async () => {
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
    await updateThisDb((db) => ({ ...db, rows: [...db.rows, newRow] }));

    // Add specific history entry
    if (user) {
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'added',
        target: 'database',
        targetName: database.name,
        description: `${user.name} added a new row to database "${database.name}"`
      });
    }

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

  const handleDatabaseNameChange = async () => {
    if (!canEdit) return;

    if (editedName.trim() && editedName !== database.name) {
      const oldName = database.name;
      await updateThisDb((db) => ({ ...db, name: editedName.trim() }));

      // Add specific history entry
      if (user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'edit',
          target: 'database',
          targetName: editedName.trim(),
          description: `${user.name} renamed database from "${oldName}" to "${editedName.trim()}"`
        });
      }
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
        <div className={`border rounded-lg ${
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
                      className={`text-left py-2 font-normal relative ${
                        index !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                      }`}
                      style={{
                        padding: index === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : '0.5rem 0.25rem',
                        minWidth: 'fit-content',
                        width: `${columnWidths[col.key] || 150}px`,
                        maxWidth: `${columnWidths[col.key] || 150}px`,
                        whiteSpace: 'nowrap',
                        position: 'relative'
                      }}
                    >
                      {/* Date column optimized for compact view */}
                      <div className={`flex items-center group ${index === 0 ? 'gap-0' : 'gap-0.5'}`}>
                        {/* Type Icon with Dropdown - Only SUPERUSER can change */}
                        <div className="relative">
                          <button
                            onClick={() => canManageColumns && setTypeDropdownOpen(typeDropdownOpen === col.key ? null : col.key)}
                            disabled={!canManageColumns}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded ${
                              canManageColumns
                                ? (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200')
                                : 'cursor-not-allowed opacity-60'
                            }`}
                            title={canManageColumns ? 'Change column type' : 'Only SUPERUSER can change column type'}
                          >
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {propertyTypeIcons[col.type] || propertyTypeIcons.text}
                            </span>
                            {canManageColumns && (
                              <ChevronDown className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            )}
                          </button>
                          {typeDropdownOpen === col.key && canManageColumns && (
                            <TypeChangeDropdown
                              currentType={col.type}
                              darkMode={darkMode}
                              onTypeChange={(type) => handleColumnTypeChange(col.key, type)}
                              onClose={() => setTypeDropdownOpen(null)}
                            />
                          )}
                        </div>

                        {/* Column Label - Only SUPERUSER can edit */}
                        <input
                          value={col.label}
                          onChange={(e) => canManageColumns && handleColumnLabelChange(col.key, e.target.value)}
                          disabled={!canManageColumns}
                          className={`text-sm font-medium ${
                            darkMode ? 'text-gray-300 bg-transparent' : 'text-gray-700 bg-transparent'
                          } border-0 focus:outline-none px-0 py-0 flex-1 ${!canManageColumns ? 'cursor-not-allowed' : ''}`}
                          placeholder="Name"
                          title={canManageColumns ? 'Edit column name' : 'Only SUPERUSER can edit column name'}
                        />

                        {/* Delete Button - Only for SUPERUSER */}
                        {canManageColumns && (
                          <button
                            onClick={() => handleDeleteProperty(col.key)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Delete column (SUPERUSER only)"
                          >
                            <MoreHorizontal className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </button>
                        )}
                      </div>

                      {/* Column Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, col.key)}
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 ${
                          resizingColumn?.key === col.key ? 'bg-blue-500' : ''
                        }`}
                        style={{ zIndex: 30 }}
                      />
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
                          padding: colIndex === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : '0.5rem 0.25rem',
                          width: `${columnWidths[col.key] || 150}px`,
                          maxWidth: `${columnWidths[col.key] || 150}px`,
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
                            padding: colIndex === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : '0.5rem 0.25rem',
                            width: `${columnWidths[col.key] || 150}px`,
                            maxWidth: `${columnWidths[col.key] || 150}px`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {prop.type === 'text' && (
                            <input
                              type="text"
                              value={prop.value}
                              onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                              onBlur={(e) => handleCellBlur(row.id, col.key, e.target.value)}
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
                              onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                              onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.valueAsNumber)}
                              onBlur={(e) => handleCellBlur(row.id, col.key, e.target.valueAsNumber)}
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
                            <DateInput
                              value={prop.value}
                              onChange={(value) => canEdit && handleValueChange(row.id, col.key, value)}
                              onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                              onBlur={(value) => handleCellBlur(row.id, col.key, value)}
                              disabled={!canEdit}
                              darkMode={darkMode}
                            />
                          )}
                          {prop.type === 'checkbox' && (
                            <input
                              type="checkbox"
                              checked={!!prop.value}
                              onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                              onChange={(e) => {
                                if (canEdit) {
                                  handleValueChange(row.id, col.key, e.target.checked);
                                  // For checkbox, trigger blur immediately after change
                                  handleCellBlur(row.id, col.key, e.target.checked);
                                }
                              }}
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
