// src/components/dashboards/DatabaseTable.tsx (Refactored with modular components)

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Smile, FileText, Edit3, ChevronDown, X, Download, Upload, ArrowUpDown, Search, Columns3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import ImportModal from './modals/ImportModal';
import WarningModal from './modals/WarningModal';
import DateInput from './DateInput';

// Import constants
import { propertyTypeIcons } from '../../constants/propertyTypeIcons';
import { dateInputStyles } from '../../styles/dateInputStyles';

// Import utilities
import { SortConfig, getSortedRows, addSort, updateSortDirection, deleteSort, clearAllSorts } from '../../utils/sortingUtils';
import { updateDatabase } from '../../utils/databaseUtils';

// Highlight colors for rows (same as TeamNotes)
const highlightColors = [
  '#FFA896', // Red
  '#FFD89B', // Yellow
  '#C4F5A4', // Green
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(database.description || '');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState({ title: '', message: '' });
  const [sortConfig, setSortConfig] = useState<SortConfig[]>(() => {
    // Set default sort to first column - DESCENDING
    if (database.columns.length > 0) {
      const firstColumn = database.columns[0];
      return [{ column: firstColumn.key, direction: 'desc' }];
    }
    return [];
  });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string; oldValue: any } | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState<{ key: string; oldLabel: string } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Load from database.columnWidths if available, otherwise use defaults
    if (database.columnWidths && Object.keys(database.columnWidths).length > 0) {
      console.log('📏 Loading saved column widths from database:', database.columnWidths);
      return database.columnWidths;
    }

    console.log('📏 No saved column widths, using defaults');
    // Initialize default widths for each column
    const widths: Record<string, number> = {};
    database.columns.forEach((col) => {
      widths[col.key] = col.type === 'date' ? 180 : 150;
    });
    return widths;
  });
  const [resizingColumn, setResizingColumn] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const [tableWidth, setTableWidth] = useState<number>(0);
  const [wrapText, setWrapText] = useState(false); // Excel-like wrap text toggle
  const horizontalScrollRef = useRef<HTMLDivElement>(null); // Ref for external horizontal scrollbar
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [showSearchInput, setShowSearchInput] = useState(false); // Toggle search input visibility on mobile
  const [showRowActionMenu, setShowRowActionMenu] = useState<string | null>(null); // Row ID for showing action menu
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null); // Popup menu position

  // Calculate table width - Update whenever columnWidths changes
  useEffect(() => {
    if (database.columns.length > 0) {
      const totalWidth = database.columns.reduce((sum, col) => sum + (columnWidths[col.key] || 150), 0);
      const containerWidth = tableContainerRef.current?.offsetWidth || 0;
      const newTableWidth = Math.max(totalWidth, containerWidth);
      setTableWidth(newTableWidth);
      console.log('📐 Table width updated:', newTableWidth, 'from column widths:', columnWidths);
    }
  }, [columnWidths, database.columns]);

  // Close row action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showRowActionMenu) {
        setShowRowActionMenu(null);
        setMenuPosition(null);
      }
    };

    if (showRowActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showRowActionMenu]);

  // Sync scroll between table container and horizontal scrollbar
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const horizontalScroll = horizontalScrollRef.current;

    if (!tableContainer || !horizontalScroll) return;

    // Sync from table to scrollbar
    const handleTableScroll = () => {
      if (horizontalScroll) {
        horizontalScroll.scrollLeft = tableContainer.scrollLeft;
      }
    };

    // Sync from scrollbar to table
    const handleScrollbarScroll = () => {
      if (tableContainer) {
        tableContainer.scrollLeft = horizontalScroll.scrollLeft;
      }
    };

    tableContainer.addEventListener('scroll', handleTableScroll);
    horizontalScroll.addEventListener('scroll', handleScrollbarScroll);

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll);
      horizontalScroll.removeEventListener('scroll', handleScrollbarScroll);
    };
  }, []);

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

  // Handle column resize with guide line (Google Sheets style) - ZERO REACT RE-RENDER
  useEffect(() => {
    let guideLineElement: HTMLDivElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn && guideLineElement) {
        // Use transform instead of left for GPU acceleration - NO LAYOUT RECALC!
        guideLineElement.style.transform = `translateX(${e.clientX}px) translateZ(0)`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - resizingColumn.startX;
        const finalWidth = Math.max(24, resizingColumn.startWidth + diff); // Min 24px for icons/numbers

        // Update CSS variable directly on ALL col elements - NO REACT RE-RENDER!
        const colElements = document.querySelectorAll(`col[data-col-key="${resizingColumn.key}"]`);
        colElements.forEach((col) => {
          (col as HTMLElement).style.width = `${finalWidth}px`;
          (col as HTMLElement).style.minWidth = '24px'; // Keep flexible minimum
        });

        // Update state immediately for responsive UI
        const updatedWidths = {
          ...columnWidths,
          [resizingColumn.key]: Math.round(finalWidth)
        };
        setColumnWidths(updatedWidths);

        console.log('📏 Saving column widths to backend:', updatedWidths);

        // Save column widths to backend so all users see the same widths
        updateThisDb((db) => ({
          ...db,
          columnWidths: updatedWidths
        }));

        // Clean up
        setResizingColumn(null);
        if (guideLineElement && guideLineElement.parentNode) {
          guideLineElement.parentNode.removeChild(guideLineElement);
          guideLineElement = null;
        }
      }
    };

    if (resizingColumn) {
      // Create guide line element directly in DOM (no React state!)
      guideLineElement = document.createElement('div');
      guideLineElement.style.cssText = `
        position: fixed;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: #3b82f6;
        pointer-events: none;
        z-index: 9999;
        left: 0;
        will-change: transform;
        transform: translateX(${resizingColumn.startX}px) translateZ(0);
        contain: strict;
      `;
      document.body.appendChild(guideLineElement);

      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-column');

      // Disable pointer events on table body during resize to prevent hover lag
      const tableBody = document.querySelector('tbody');
      if (tableBody) {
        (tableBody as HTMLElement).style.pointerEvents = 'none';
      }
    }

    return () => {
      if (guideLineElement && guideLineElement.parentNode) {
        guideLineElement.parentNode.removeChild(guideLineElement);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing-column');

      // Re-enable pointer events on table body
      const tableBody = document.querySelector('tbody');
      if (tableBody) {
        (tableBody as HTMLElement).style.pointerEvents = '';
      }
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
      try {
        await updateDatabase(
          updatedDb,
          token,
          undefined, // Don't use generic history
          user?.name,
          user?.role as 'SUPERUSER' | 'ADMIN' | 'UMUM'
        );
        console.log('✅ Database updated successfully on backend');
      } catch (error) {
        console.error('❌ Failed to save to backend:', error);
        alert('Failed to save changes to server. Please try again.');
      }
    } else {
      console.warn('⚠️ Database ID is not numeric, skipping backend sync:', updatedDb.id);
    }
  };

  const handleColumnLabelFocus = (key: string) => {
    const column = database.columns.find(c => c.key === key);
    if (column) {
      setEditingColumnLabel({ key, oldLabel: column.label });
    }
  };

  const handleColumnLabelChange = (key: string, value: string) => {
    if (!canEdit) return;

    // Just update the value without adding history
    updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c))
    }));
  };

  const handleColumnLabelBlur = async (key: string, newLabel: string) => {
    // Add history only when finished editing
    if (editingColumnLabel && editingColumnLabel.key === key) {
      const oldLabel = editingColumnLabel.oldLabel;
      if (oldLabel !== newLabel && newLabel.trim() && user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'edit',
          target: 'database',
          targetName: database.name,
          description: `${user.name} renamed column "${oldLabel}" to "${newLabel}" in database "${database.name}"`
        });
      }
      setEditingColumnLabel(null);
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

        // Get sorted rows to find the correct visual position
        const sortedRows = getSortedRows(database.rows, database.columns, sortConfig);
        const visualRowIndex = sortedRows.findIndex(r => r.id === rowId) + 1;

        // Get first column value for better identification
        const row = database.rows.find(r => r.id === rowId);
        const firstColumnKey = database.columns[0]?.key;
        const firstColumnValue = row?.properties[firstColumnKey]?.value || '';
        const firstColumnLabel = database.columns[0]?.label || '';

        // Create detailed description
        const rowIdentifier = firstColumnValue
          ? `row ${visualRowIndex} (${firstColumnLabel}: "${firstColumnValue}")`
          : `row ${visualRowIndex}`;

        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'edit',
          target: 'database',
          targetName: database.name,
          description: `${user.name} updated "${columnLabel}" in ${rowIdentifier} from "${oldValue || '(empty)'}" to "${newValue || '(empty)'}" in database "${database.name}"`
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

    // Update database first
    await updateThisDb((db) => {
      const updatedColumns = [...db.columns, { key: newKey, label: name, type }];
      const updatedRows = db.rows.map((row) => ({
        ...row,
        properties: { ...row.properties, [newKey]: { value: '', type } }
      }));
      return { ...db, columns: updatedColumns, rows: updatedRows };
    });

    // Then add history entry after database is updated
    if (user) {
      try {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'create',
          target: 'database',
          targetName: database.name,
          description: `${user.name} added new column "${name}" (type: ${type}) to database "${database.name}"`
        });
      } catch (error) {
        console.error('Error adding history:', error);
      }
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
      // Get row details before deleting for toast notification
      const rowToDelete = database.rows.find(r => r.id === deleteTarget.id);
      const firstColumnKey = database.columns[0]?.key;
      const firstColumnLabel = database.columns[0]?.label || 'Column';
      const firstColumnValue = rowToDelete?.properties[firstColumnKey]?.value || '(empty)';

      await updateThisDb((db) => ({
        ...db,
        rows: db.rows.filter((r) => r.id !== deleteTarget.id)
      }));

      // Show success toast for row deletion - Red background with checkmark
      toast.success(
        'Successfully deleted 1 row!',
        {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '500',
            border: 'none',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );

      // Add specific history entry for row deletion
      if (user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'delete',
          target: 'database',
          targetName: database.name,
          description: `${user.name} deleted a row (${firstColumnLabel}: "${firstColumnValue}") from database "${database.name}"`
        });
      }
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleSetRowHighlight = async (rowId: string, color: string | null) => {
    if (!canEdit) return;

    await updateThisDb((db) => ({
      ...db,
      rows: db.rows.map((row) =>
        row.id === rowId
          ? { ...row, highlightColor: color || undefined }
          : row
      )
    }));

    // Add history entry
    if (user) {
      const action = color ? 'highlighted' : 'removed highlight from';
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'edit',
        target: 'database',
        targetName: database.name,
        description: `${user.name} ${action} a row in database "${database.name}"`
      });
    }

    setShowRowActionMenu(null);
  };

  const handleDuplicateRow = async (rowId: string) => {
    if (!canEdit) return;

    // Find the row to duplicate
    const rowToDuplicate = database.rows.find(r => r.id === rowId);
    if (!rowToDuplicate) return;

    // Get the first column value for better identification in toast
    const firstColumnKey = database.columns[0]?.key;
    const firstColumnLabel = database.columns[0]?.label || 'Column';
    const firstColumnValue = rowToDuplicate.properties[firstColumnKey]?.value || '(empty)';

    // Create a new row with the same properties but new ID
    const duplicatedRow: DatabaseRow = {
      id: `row-${Date.now()}`,
      properties: { ...rowToDuplicate.properties },
      highlightColor: rowToDuplicate.highlightColor
    };

    // Find the index of the original row
    const originalIndex = database.rows.findIndex(r => r.id === rowId);

    // Insert the duplicated row right above the original row (same index)
    await updateThisDb((db) => {
      const newRows = [...db.rows];
      newRows.splice(originalIndex, 0, duplicatedRow);
      return { ...db, rows: newRows };
    });

    // Show success toast - Green background with checkmark
    toast.success(
      'Successfully duplicated 1 row!',
      {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: '500',
          border: 'none',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10b981',
        },
      }
    );

    // Add history entry
    if (user) {
      await addHistory({
        userName: user.name,
        userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
        action: 'create',
        target: 'database',
        targetName: database.name,
        description: `${user.name} duplicated a row (${firstColumnLabel}: "${firstColumnValue}") in database "${database.name}"`
      });
    }

    setShowRowActionMenu(null);
    setMenuPosition(null);
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

    // Clear sorting so new row appears at the top
    setSortConfig([]);

    // Add new row at the beginning (index 0) instead of at the end
    await updateThisDb((db) => ({ ...db, rows: [newRow, ...db.rows] }));

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
      newRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error('You do not have permission to import CSV. Only ADMIN and SUPERUSER can edit.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const text = await file.text();

      // Remove BOM if present
      const cleanText = text.replace(/^\ufeff/, '');

      // Detect delimiter (semicolon or comma)
      const firstLine = cleanText.split(/\r?\n/)[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      // Parse entire CSV properly handling quoted fields with newlines
      const parseCSV = (csvText: string): string[][] => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Double quote - add single quote to field
              currentField += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            // End of field
            currentRow.push(currentField.trim());
            currentField = '';
          } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            // End of row (handle both \n and \r\n)
            if (char === '\r') i++; // Skip \n if we're at \r
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field.length > 0)) {
              rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
          } else if (char !== '\r' || inQuotes) {
            // Add character to current field (skip standalone \r outside quotes)
            currentField += char;
          }
        }

        // Add last field and row if any
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field.length > 0)) {
            rows.push(currentRow);
          }
        }

        return rows;
      };

      // Auto-detect column type based on sample values
      const detectColumnType = (values: string[]): 'text' | 'number' | 'date' => {
        // Filter out empty values for type detection
        const nonEmptyValues = values.filter(v => v && v.trim());
        if (nonEmptyValues.length === 0) return 'text';

        // Sample first few non-empty values (max 10)
        const sampleValues = nonEmptyValues.slice(0, 10);

        // Check if all samples are numbers
        const allNumbers = sampleValues.every(v => {
          const num = v.replace(/,/g, ''); // Remove thousand separators
          return !isNaN(Number(num)) && num.trim() !== '';
        });

        if (allNumbers) return 'number';

        // Check if all samples are dates (DD/MM/YYYY or YYYY-MM-DD format)
        const datePattern1 = /^\d{1,2}\/\d{1,2}\/\d{4}$/; // DD/MM/YYYY
        const datePattern2 = /^\d{4}-\d{1,2}-\d{1,2}$/; // YYYY-MM-DD
        const allDates = sampleValues.every(v =>
          datePattern1.test(v.trim()) || datePattern2.test(v.trim())
        );

        if (allDates) return 'date';

        return 'text';
      };

      // Parse CSV
      const allRows = parseCSV(cleanText);

      if (allRows.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      // First row is headers - NORMALIZE by removing newlines and extra spaces
      const headers = allRows[0].map(header =>
        header.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
      );

      console.log('=== NORMALIZED HEADERS ===');
      console.log(headers);

      // Find KODE JADWAL column index
      const kodeJadwalIndex = headers.findIndex(h => h.includes('KODE') && h.includes('JADWAL'));
      console.log('KODE JADWAL column index:', kodeJadwalIndex);

      // Rest are data rows
      const dataRows = allRows.slice(1);

      // Check first 5 rows for KODE JADWAL data
      console.log('=== FIRST 5 ROWS - KODE JADWAL DATA ===');
      dataRows.slice(0, 5).forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`, row[kodeJadwalIndex]);
      });

      // Check for empty columns and warn user
      const emptyColumns: string[] = [];
      headers.forEach((header, colIndex) => {
        const columnValues = dataRows.map(row => row[colIndex] || '');
        const allEmpty = columnValues.every(v => !v || v.trim() === '');
        if (allEmpty) {
          emptyColumns.push(header);
        }
      });

      if (emptyColumns.length > 0) {
        console.warn('⚠️ WARNING: The following columns have NO data in CSV file:');
        console.warn(emptyColumns);

        // Show warning modal if KODE JADWAL is empty
        if (emptyColumns.some(col => col.includes('KODE') && col.includes('JADWAL'))) {
          setWarningMessage({
            title: 'Column "KODE JADWAL" is Empty',
            message: 'Column "KODE JADWAL" is completely EMPTY in your CSV file!\n\nPlease check your CSV file and make sure it contains data for this column.'
          });
          setShowWarningModal(true);
        }
      }

      if (dataRows.length === 0) {
        alert('CSV file contains no data rows');
        return;
      }

      // Ensure all data rows have same number of columns as headers
      const maxColumns = headers.length;
      const normalizedDataRows = dataRows.map(row => {
        const normalized = [...row];
        // Pad with empty strings if row has fewer columns
        while (normalized.length < maxColumns) {
          normalized.push('');
        }
        // Trim if row has more columns
        return normalized.slice(0, maxColumns);
      });

      // Detect type for each column based on data
      const columnTypes: ('text' | 'number' | 'date')[] = headers.map((_, colIndex) => {
        const columnValues = normalizedDataRows.map(row => row[colIndex] || '');
        return detectColumnType(columnValues);
      });

      // Create columns with detected types
      const newColumns = headers.map((header, index) => ({
        key: `col-${Date.now()}-${index}`,
        label: header,
        type: columnTypes[index]
      }));

      // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr: string): string => {
        if (!dateStr) return '';

        // Check if already in YYYY-MM-DD format
        const isoPattern = /^\d{4}-\d{1,2}-\d{1,2}$/;
        if (isoPattern.test(dateStr.trim())) {
          return dateStr.trim();
        }

        // Convert DD/MM/YYYY to YYYY-MM-DD
        const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = dateStr.trim().match(ddmmyyyyPattern);
        if (match) {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        }

        return dateStr; // Return as-is if no pattern matches
      };

      // Create rows with proper typing and date format conversion
      const newRows: DatabaseRow[] = normalizedDataRows.map((values, rowIndex) => {
        const properties: Record<string, { value: string; type: string }> = {};

        newColumns.forEach((col, colIndex) => {
          let cellValue = values[colIndex] || '';

          // Convert date format if column type is date
          if (col.type === 'date' && cellValue) {
            cellValue = convertDateFormat(cellValue);
          }

          properties[col.key] = {
            value: cellValue,
            type: col.type
          };
        });

        return {
          id: `row-${Date.now()}-${rowIndex}`,
          properties
        };
      });

      // Update database with imported data
      console.log('📊 Importing CSV data...');
      console.log('Database ID:', database.id, 'Type:', typeof database.id);
      console.log('New columns:', newColumns.length);
      console.log('New rows:', newRows.length);

      await updateThisDb((db) => ({
        ...db,
        columns: newColumns,
        rows: newRows
      }));

      // Apply default descending sort on first column after import
      if (newColumns.length > 0) {
        setSortConfig([{ column: newColumns[0].key, direction: 'desc' }]);
      }

      console.log('✅ CSV import completed - updateThisDb called');

      // Add history entry
      if (user) {
        await addHistory({
          userName: user.name,
          userRole: user.role as 'SUPERUSER' | 'ADMIN' | 'UMUM',
          action: 'edit',
          target: 'database',
          targetName: database.name,
          description: `${user.name} imported CSV file with ${newRows.length} rows into database "${database.name}"`
        });
      }

      toast.success(`Successfully imported ${newRows.length} rows from CSV file!`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Error importing CSV file. Please check the file format.');
    }
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

  // Helper function to format date to Indonesian format for search
  const formatDateForSearch = (dateValue: string): string => {
    if (!dateValue) return '';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue;

      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      // Return multiple formats for matching: "Senin", "22", "Des", "2025", "22 Des", "Senin, 22 Des 2025"
      return `${dayName} ${day} ${month} ${year} ${day} ${month} ${dayName}, ${day} ${month} ${year}`.toLowerCase();
    } catch {
      return dateValue;
    }
  };

  // Filter rows based on search query
  const filteredRows = sortedRows.filter((row) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in all column values
    return database.columns.some((col) => {
      const property = row.properties[col.key];
      if (!property) return false;

      let searchableValue = '';

      // For date columns, format to Indonesian format for search
      if (col.type === 'date') {
        searchableValue = formatDateForSearch(property.value?.toString() || '');
      } else {
        searchableValue = property.value?.toString().toLowerCase() || '';
      }

      return searchableValue.includes(query);
    });
  });

  // Virtual scrolling setup - Only render visible rows for performance
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => wrapText ? 80 : 42, // Dynamic row height: 80px for wrapped text, 42px for normal
    overscan: 10, // Render 10 extra items above and below viewport for smooth scrolling
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full overflow-auto hide-scrollbar ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}
    >
      {/* Header - Notion Style */}
      <div className="px-4 sm:px-6 lg:px-12 pt-6 pb-4">
        {/* Title Section */}
        <div className="mb-6">
          {/* Title with Icon (Inline) */}
          {isEditingName ? (
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleDatabaseNameChange}
              onKeyDown={handleNameKeyPress}
              autoFocus
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold w-full ${
                darkMode ? 'bg-[#191919] text-white' : 'bg-white text-gray-900'
              } border-0 focus:outline-none p-0`}
              placeholder="Untitled"
            />
          ) : (
            <>
              {/* Title Row with Action Buttons on Desktop */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {/* Title and Edit Buttons */}
                <div className="flex items-center gap-3 group">
                  <h1
                    onClick={() => canEdit && setIsEditingName(true)}
                    className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${canEdit ? 'cursor-text' : 'cursor-default'} ${
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

                {/* Action Buttons - Desktop: On the right side, Mobile: Below title */}
                <div className="hidden lg:flex items-center gap-1 -ml-2 flex-shrink-0">
                  {/* Icon Button - Always visible */}
                  <div className="relative flex-shrink-0" id="emoji-button-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!canEdit) {
                          toast.error('Only ADMIN and SUPERUSER can change icon');
                          return;
                        }
                        // Use requestAnimationFrame to prevent visual glitch
                        requestAnimationFrame(() => {
                          setShowEmojiPicker(!showEmojiPicker);
                        });
                      }}
                      type="button"
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        !canEdit
                          ? darkMode
                            ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                            : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                          : darkMode
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={!canEdit ? 'Only ADMIN and SUPERUSER can change icon' : database.icon ? 'Change icon' : 'Add icon'}
                    >
                      <Smile className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xs:inline">{database.icon ? 'Change icon' : 'Add icon'}</span>
                      <span className="xs:hidden">Icon</span>
                    </button>
                    {showEmojiPicker && canEdit && (
                      <EmojiPicker
                        darkMode={darkMode}
                        onSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>

                  {/* Description Button - Always visible if no description */}
                  {!database.description && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!canEdit) {
                          toast.error('Only ADMIN and SUPERUSER can add description');
                          return;
                        }
                        handleAddDescription();
                      }}
                      type="button"
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                        !canEdit
                          ? darkMode
                            ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                            : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                          : darkMode
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={!canEdit ? 'Only ADMIN and SUPERUSER can add description' : 'Add description'}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xs:inline">Add description</span>
                      <span className="xs:hidden">Description</span>
                    </button>
                  )}

                  {/* Import Button - Always visible */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!canEdit) {
                        toast.error('Only ADMIN and SUPERUSER can import data');
                        return;
                      }
                      setShowImportModal(true);
                    }}
                    type="button"
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                      !canEdit
                        ? darkMode
                          ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                          : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={!canEdit ? 'Only ADMIN and SUPERUSER can import data' : 'Import CSV file'}
                  >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span>Import</span>
                  </button>

                  {/* Export Button - Always visible and functional */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                      darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Export data to CSV or JSON"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Description Section - Right after title */}
              {(database.description || isEditingDescription) && (
                <div className="mt-3">
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

              {/* Action Buttons - Mobile: Below description - Single row */}
              <div className="flex lg:hidden items-center gap-1 mt-3 -ml-2 flex-nowrap overflow-x-auto">
                {/* Icon Button - Always visible */}
                <div className="relative flex-shrink-0" id="emoji-button-container">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!canEdit) {
                        toast.error('Only ADMIN and SUPERUSER can change icon');
                        return;
                      }
                      // Use requestAnimationFrame to prevent visual glitch
                      requestAnimationFrame(() => {
                        setShowEmojiPicker(!showEmojiPicker);
                      });
                    }}
                    type="button"
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap transition-colors ${
                      !canEdit
                        ? darkMode
                          ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                          : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={!canEdit ? 'Only ADMIN and SUPERUSER can change icon' : database.icon ? 'Change icon' : 'Add icon'}
                  >
                    <Smile className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xs:inline">{database.icon ? 'Change icon' : 'Add icon'}</span>
                    <span className="xs:hidden">Icon</span>
                  </button>
                  {showEmojiPicker && canEdit && (
                    <EmojiPicker
                      darkMode={darkMode}
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>

                {/* Description Button - Always visible if no description */}
                {!database.description && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!canEdit) {
                        toast.error('Only ADMIN and SUPERUSER can add description');
                        return;
                      }
                      handleAddDescription();
                    }}
                    type="button"
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                      !canEdit
                        ? darkMode
                          ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                          : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={!canEdit ? 'Only ADMIN and SUPERUSER can add description' : 'Add description'}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Add description</span>
                    <span className="xs:hidden">Description</span>
                  </button>
                )}

                {/* Import Button - Always visible */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!canEdit) {
                      toast.error('Only ADMIN and SUPERUSER can import data');
                      return;
                    }
                    setShowImportModal(true);
                  }}
                  type="button"
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                    !canEdit
                      ? darkMode
                        ? 'text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                        : 'text-gray-400 cursor-not-allowed opacity-50 pointer-events-auto'
                      : darkMode
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={!canEdit ? 'Only ADMIN and SUPERUSER can import data' : 'Import CSV file'}
                >
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span>Import</span>
                </button>

                {/* Export Button - Always visible and functional */}
                <button
                  onClick={() => setShowExportModal(true)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${
                    darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Export data to CSV or JSON"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span>Export</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Search Input - Below title, only visible when toggled */}
        {showSearchInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mb-3 mt-2"
          >
            <div className={`relative rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
            }`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  // Close search input if empty when user clicks outside
                  if (!searchQuery.trim()) {
                    setTimeout(() => setShowSearchInput(false), 200);
                  }
                }}
                placeholder="Search"
                autoFocus
                className={`w-full pl-9 pr-10 py-2 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-gray-800 text-white placeholder-gray-500 border-0'
                    : 'bg-white text-gray-900 placeholder-gray-400 border-0'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {/* Clear button */}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchInput(false);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Table Header */}
        <div className="flex items-center justify-between mb-3 mt-2">
          <div className="flex items-center gap-3">
            {/* Table Label */}
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

            {/* Search Bar - Desktop: Always visible, Mobile: Icon that toggles input */}
            <div className="relative">
              {/* Mobile: Search Icon Button */}
              <button
                onClick={() => setShowSearchInput(!showSearchInput)}
                className={`lg:hidden p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                } ${showSearchInput ? (darkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                title="Search"
              >
                <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>

              {/* Desktop: Always visible search bar */}
              <div className={`hidden lg:block relative rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
              }`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className={`w-64 pl-9 pr-10 py-2 rounded-lg text-sm ${
                    darkMode
                      ? 'bg-gray-800 text-white placeholder-gray-500 border-0'
                      : 'bg-white text-gray-900 placeholder-gray-400 border-0'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Wrap Text Toggle - Excel-like */}
            <button
              onClick={() => setWrapText(!wrapText)}
              className={`flex items-center gap-1 px-2 py-2 rounded-full text-xs font-medium transition-colors ${
                wrapText
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={wrapText ? "Disable text wrapping" : "Enable text wrapping (Excel-like)"}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              <span className="hidden md:inline text-xs sm:text-sm">Wrap</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1 px-2 py-2 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-xs sm:text-sm">Sort</span>
                {/* Mobile & Tablet: Show count */}
                <span className="md:hidden text-xs">{sortConfig.length > 0 ? sortConfig.length : '1'}</span>
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

            {/* New Rows Button - Positioned between Sort and Add Property */}
            {canEdit && (
              <button
                onClick={handleAddRow}
                className={`flex items-center gap-1 px-2 py-2 rounded-full text-xs font-medium transition-colors ${
                  darkMode
                    ? 'bg-white hover:bg-gray-100 text-gray-900'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
                title="Add a new row"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Rows</span>
              </button>
            )}

            {/* Add Property Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canEdit) {
                  toast.error('Only ADMIN and SUPERUSER can add properties');
                  return;
                }
                setShowAddProperty(true);
              }}
              type="button"
              className={`flex items-center gap-1 px-2 py-2 rounded-full text-xs font-medium transition-colors ${
                !canEdit
                  ? darkMode
                    ? 'bg-white text-gray-900 cursor-not-allowed opacity-40 pointer-events-auto'
                    : 'bg-gray-900 text-white cursor-not-allowed opacity-40 pointer-events-auto'
                  : darkMode
                    ? 'bg-white hover:bg-gray-100 text-gray-900'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
              title={!canEdit ? 'Only ADMIN and SUPERUSER can add properties' : 'Add a new column'}
            >
              <Columns3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden md:inline text-xs sm:text-sm">Property</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table - Notion Style with Scroll */}
      <div className="px-4 sm:px-6 lg:px-12 pb-12">
        <div className={`border rounded-lg overflow-hidden ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
            {/* Scrollable container - both horizontal and vertical scroll */}
            <div
              ref={tableContainerRef}
              className="overflow-auto hide-scrollbar max-h-[calc(100vh-300px)]"
              style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
            <table className="border-collapse" style={{
              width: tableWidth > 0 ? `${tableWidth}px` : '100%',
              tableLayout: 'fixed' // Fixed layout for consistent column widths
            }}>
              {/* Column width definitions - PERFORMANCE: Define widths once here instead of on every cell */}
              <colgroup>
                {database.columns.map((col) => (
                  <col
                    key={col.key}
                    data-col-key={col.key}
                    style={{
                      width: `${columnWidths[col.key] || 150}px`,
                      minWidth: '24px' // Allow columns to shrink to 24px minimum
                    }}
                  />
                ))}
              </colgroup>
              {/* Table Header - Sticky */}
              <thead
                className={`sticky top-0 ${darkMode ? 'bg-[#202020]' : 'bg-gray-50'}`}
                style={{
                  zIndex: 100,
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
              >
                <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  {database.columns.map((col, index) => (
                    <th
                      key={col.key}
                      ref={index === database.columns.length - 1 ? newColumnRef : null}
                      className={`group text-left py-2 font-normal relative ${
                        index !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                      } ${index === 0 ? `sticky left-0 ${darkMode ? 'bg-[#202020]' : 'bg-gray-50'}` : ''}`}
                      style={{
                        padding: index === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : '0.5rem 0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: typeDropdownOpen === col.key ? 'visible' : 'hidden',
                        textOverflow: 'ellipsis',
                        zIndex: typeDropdownOpen === col.key ? 200 : (index === 0 ? 101 : 100),
                        ...(index === 0 && { boxShadow: '2px 0 4px rgba(0,0,0,0.1)' })
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
                          onFocus={() => canManageColumns && handleColumnLabelFocus(col.key)}
                          onChange={(e) => canManageColumns && handleColumnLabelChange(col.key, e.target.value)}
                          onBlur={(e) => canManageColumns && handleColumnLabelBlur(col.key, e.target.value)}
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

                      {/* Column Resize Handle - Show on all columns except last */}
                      {index !== database.columns.length - 1 && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, col.key)}
                          className={`resize-handle absolute right-0 top-0 bottom-0 cursor-col-resize ${
                            resizingColumn?.key === col.key
                              ? 'w-1 bg-blue-500 opacity-100'
                              : 'w-1 hover:bg-blue-400 hover:opacity-80 opacity-0'
                          }`}
                          style={{
                            zIndex: 30,
                            marginRight: '-0.5px',
                            transition: 'background-color 0.2s ease, opacity 0.2s ease, width 0.1s ease'
                          }}
                          title="Drag to resize column"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body - VIRTUALIZED for performance with 1000+ rows */}
              <tbody
                style={{
                  willChange: resizingColumn ? 'auto' : 'contents',
                  pointerEvents: resizingColumn ? 'none' : 'auto'
                }}
              >
                {/* Spacer for virtual scrolling - top padding */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}>
                    <td colSpan={database.columns.length} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}

                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = filteredRows[virtualRow.index];
                  const rowIndex = virtualRow.index;

                  return (
                    <tr
                      key={row.id}
                      ref={rowIndex === 0 ? newRowRef : null}
                      data-row-id={row.id}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) {
                          setHoveredRow(row.id);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) {
                          setHoveredRow(null);
                        }
                      }}
                      className={`group border-b ${
                        darkMode ? 'hover:bg-[#202020] border-gray-800' : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      style={{
                        height: `${virtualRow.size}px`,
                        backgroundColor: row.highlightColor || undefined,
                      }}
                    >
                      {database.columns.map((col, colIndex) => {
                        const prop = row.properties[col.key];
                        if (!prop) return <td
                          key={col.key}
                          className={`py-2 ${
                            colIndex !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                          } ${colIndex === 0 ? `sticky left-0 ${darkMode ? 'bg-[#191919] group-hover:bg-[#202020]' : 'bg-white group-hover:bg-gray-50'}` : ''}`}
                          style={{
                            padding: colIndex === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : '0.5rem 0.25rem',
                            whiteSpace: wrapText ? 'normal' : 'nowrap',
                            overflow: 'hidden',
                            textOverflow: wrapText ? 'clip' : 'ellipsis',
                            wordWrap: wrapText ? 'break-word' : 'normal',
                            verticalAlign: 'top',
                            zIndex: colIndex === 0 ? 50 : 1,
                            backgroundColor: colIndex === 0 ? (row.highlightColor || undefined) : undefined,
                            ...(colIndex === 0 && { boxShadow: '2px 0 4px rgba(0,0,0,0.1)' })
                          }}
                        ></td>;

                        return (
                          <td
                            key={col.key}
                            className={`py-2 ${
                              colIndex !== database.columns.length - 1 ? (darkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                            } ${colIndex === 0 ? `sticky left-0 ${darkMode ? 'bg-[#191919] group-hover:bg-[#202020]' : 'bg-white group-hover:bg-gray-50'}` : ''} ${
                              colIndex === database.columns.length - 1 ? 'relative' : ''
                            }`}
                            style={{
                              padding: colIndex === 0 ? '0.5rem 0.25rem 0.5rem 0.75rem' : colIndex === database.columns.length - 1 ? '0.5rem 2.5rem 0.5rem 0.25rem' : '0.5rem 0.25rem',
                              whiteSpace: wrapText ? 'normal' : 'nowrap',
                              overflow: colIndex === database.columns.length - 1 ? 'visible' : 'hidden',
                              textOverflow: wrapText ? 'clip' : 'ellipsis',
                              wordWrap: wrapText ? 'break-word' : 'normal',
                              verticalAlign: 'top',
                              zIndex: colIndex === 0 ? 50 : 1,
                              backgroundColor: colIndex === 0 ? (row.highlightColor || undefined) : undefined,
                              ...(colIndex === 0 && { boxShadow: '2px 0 4px rgba(0,0,0,0.1)' })
                            }}
                          >
                            {/* Row Action Menu Button - Only show on hover for last column and only for users with edit permission */}
                            {colIndex === database.columns.length - 1 && canEdit && hoveredRow === row.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (showRowActionMenu === row.id) {
                                    // Close menu if already open
                                    setShowRowActionMenu(null);
                                    setMenuPosition(null);
                                  } else {
                                    // Open menu and calculate position
                                    const rowElement = document.querySelector(`[data-row-id="${row.id}"]`) as HTMLElement;
                                    if (rowElement) {
                                      const rect = rowElement.getBoundingClientRect();
                                      setMenuPosition({
                                        top: rect.bottom + 4, // 4px below the row
                                        right: 20 // 20px from right edge
                                      });
                                    }
                                    setShowRowActionMenu(row.id);
                                  }
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                                style={{ zIndex: 60 }}
                              >
                                {/* 3 Dots Icon - Custom SVG */}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="8" cy="3" r="1.5" fill={row.highlightColor ? '#374151' : (darkMode ? '#9ca3af' : '#6b7280')} />
                                  <circle cx="8" cy="8" r="1.5" fill={row.highlightColor ? '#374151' : (darkMode ? '#9ca3af' : '#6b7280')} />
                                  <circle cx="8" cy="13" r="1.5" fill={row.highlightColor ? '#374151' : (darkMode ? '#9ca3af' : '#6b7280')} />
                                </svg>
                              </button>
                            )}
                            {prop.type === 'text' && (
                              wrapText ? (
                                <textarea
                                  value={prop.value}
                                  onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                                  onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                                  onBlur={(e) => handleCellBlur(row.id, col.key, e.target.value)}
                                  disabled={!canEdit}
                                  placeholder=""
                                  rows={1}
                                  className={`w-full text-sm resize-none ${
                                    row.highlightColor && darkMode
                                      ? 'bg-transparent text-gray-900'
                                      : darkMode
                                        ? 'bg-transparent text-gray-300'
                                        : 'bg-transparent text-gray-900'
                                  } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    minHeight: '1.5rem',
                                    maxHeight: '10rem',
                                    overflow: 'auto'
                                  }}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={prop.value}
                                  onFocus={() => handleCellFocus(row.id, col.key, prop.value)}
                                  onChange={(e) => canEdit && handleValueChange(row.id, col.key, e.target.value)}
                                  onBlur={(e) => handleCellBlur(row.id, col.key, e.target.value)}
                                  disabled={!canEdit}
                                  placeholder=""
                                  className={`w-full text-sm ${
                                    row.highlightColor && darkMode
                                      ? 'bg-transparent text-gray-900'
                                      : darkMode
                                        ? 'bg-transparent text-gray-300'
                                        : 'bg-transparent text-gray-900'
                                  } border-0 focus:outline-none px-0 py-0 ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                              )
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
                                  row.highlightColor && darkMode
                                    ? 'bg-transparent text-gray-900'
                                    : darkMode
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
                                highlightColor={row.highlightColor}
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
                                className={`custom-checkbox ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Spacer for virtual scrolling - bottom padding */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{
                    height: `${
                      rowVirtualizer.getTotalSize() -
                      (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)
                    }px`
                  }}>
                    <td colSpan={database.columns.length} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
              </tbody>
            </table>

            {/* Empty State for Search */}
            {filteredRows.length === 0 && searchQuery.trim() && (
              <div className={`text-center py-12 ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No data found for "{searchQuery}"
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Try a different search term
                </p>
              </div>
            )}
          </div>

          {/* External Horizontal Scrollbar - Excel-like */}
          <div
            ref={horizontalScrollRef}
            className={`overflow-x-auto custom-scrollbar mt-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}
            style={{
              height: '12px',
              overflowY: 'hidden'
            }}
          >
            <div style={{ width: `${tableWidth}px`, height: '1px' }} />
          </div>
        </div>
      </div>

      {/* Row Action Popup Menu - Rendered at document level for proper z-index */}
      {showRowActionMenu && menuPosition && (
        <div
          className={`fixed w-48 rounded-lg shadow-2xl border ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{
            zIndex: 9999,
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Highlight Color Section */}
          <div className={`p-3 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <p className={`text-xs font-medium mb-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Highlight Color
            </p>
            <div className="flex gap-2">
              {highlightColors.map((color) => {
                const currentRow = database.rows.find(r => r.id === showRowActionMenu);
                return (
                  <button
                    key={color}
                    onClick={() => handleSetRowHighlight(showRowActionMenu, color)}
                    className={`w-8 h-8 rounded transition-all ${
                      currentRow?.highlightColor === color
                        ? 'ring-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title="Apply highlight"
                  />
                );
              })}
              {/* Remove Highlight Button */}
              {database.rows.find(r => r.id === showRowActionMenu)?.highlightColor && (
                <button
                  onClick={() => handleSetRowHighlight(showRowActionMenu, null)}
                  className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all hover:scale-105 ${
                    darkMode
                      ? 'border-gray-600 hover:bg-gray-700'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                  title="Remove highlight"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Duplicate Row Option */}
          <button
            onClick={() => handleDuplicateRow(showRowActionMenu)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700 border-gray-700'
                : 'text-gray-700 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate Row
          </button>

          {/* Delete Row Option */}
          <button
            onClick={() => {
              handleDeleteRow(showRowActionMenu);
              setShowRowActionMenu(null);
              setMenuPosition(null);
            }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              darkMode
                ? 'text-red-400 hover:bg-gray-700'
                : 'text-red-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Row
          </button>
        </div>
      )}

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

      <ImportModal
        show={showImportModal}
        darkMode={darkMode}
        onImport={handleImportCSV}
        onClose={() => setShowImportModal(false)}
      />

      <WarningModal
        show={showWarningModal}
        darkMode={darkMode}
        title={warningMessage.title}
        message={warningMessage.message}
        onConfirm={() => setShowWarningModal(false)}
      />

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleImportCSV}
        className="hidden"
      />
    </motion.div>
  );
};

export default DatabaseTable;
