import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronRight,
  Pencil,
  Home,
  Menu,
  X,
  Trash2,
  Edit3,
  Moon,
  Sun,
} from 'lucide-react';

/* ---------------- Types ---------------- */
interface Property {
  value: any;
  type: string;
}

interface DatabaseRow {
  id: string;
  properties: { [key: string]: Property };
}

interface Column {
  key: string;
  label: string;
  type: string;
}

interface Database {
  id: string;
  name: string;
  rows: DatabaseRow[];
  columns: Column[];
}

interface MenuItem {
  id: string;
  name: string;
}

/* ---------------- Constants ---------------- */
const menuItems: MenuItem[] = [{ id: '1', name: 'Team Notes' }];

const propertyTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
];

/* ---------------- Sidebar ---------------- */
const Sidebar = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onCreateDatabase,
  onDeleteDatabase,
  selectedMenu,
  onSelectMenu,
  onLogout,
  isOpen,
  setIsOpen,
  darkMode,
  toggleDarkMode,
}: {
  databases: Database[];
  selectedDatabase: string | null;
  onSelectDatabase: (id: string | null) => void;
  onCreateDatabase: () => void;
  onDeleteDatabase: (id: string) => void;
  selectedMenu: string | null;
  onSelectMenu: (id: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, dbId: string) => {
    e.stopPropagation();
    setDeleteDbId(dbId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteDbId) {
      onDeleteDatabase(deleteDbId);
      setShowDeleteConfirm(false);
      setDeleteDbId(null);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25 }}
            className={`fixed lg:static z-40 top-0 left-0 w-64 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-r h-full flex flex-col ${isOpen ? 'shadow-xl' : ''}`}
          >
            <div className="p-5 flex flex-col flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      My Workspace
                    </div>
                  </div>
                </div>
                <button
                  className={`lg:hidden p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
              </div>

              <nav className="space-y-2 mb-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectMenu(item.id);
                      onSelectDatabase(null);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                      selectedMenu === item.id && !selectedDatabase
                        ? darkMode
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-50 text-[#2563eb]'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>

              <div className="mb-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Databases
                  </span>
                  <button
                    onClick={onCreateDatabase}
                    className={`p-1 rounded transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    title="New Database"
                    aria-label="Create database"
                  >
                    <Plus className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  {databases.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => {
                        onSelectDatabase(db.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 group ${
                        selectedDatabase === db.id
                          ? darkMode
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-blue-50 text-[#2563eb]'
                          : darkMode
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3" />
                      <span className="truncate flex-1">{db.name}</span>
                      <button
                        onClick={(e) => handleDeleteClick(e, db.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                        title="Delete database"
                        aria-label={`Delete ${db.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-3 space-y-2`}>
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-red-900 hover:text-red-300'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Delete Database</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to delete this database? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-4 py-2 border rounded ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Logout Confirmation</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to logout?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-4 py-2 border rounded ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------------- Header ---------------- */
const Header = ({ onMenuClick, darkMode }: { onMenuClick: () => void; darkMode: boolean }) => (
  <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border-b px-4 sm:px-6 lg:px-12 py-4 flex-shrink-0`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className={`lg:hidden p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0`}>
            Morning Team!
          </h1>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last edited 2 hours ago
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 ${
              darkMode ? 'border-gray-700' : 'border-white'
            } shadow-sm ${i !== 1 ? '-ml-3' : ''}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  </motion.header>
);

/* ---------------- Database Table Editor ---------------- */
const DatabaseTable = ({
  database,
  setDatabases,
  darkMode,
}: {
  database: Database;
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
  darkMode: boolean;
}) => {
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('text');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'row' | 'column'; id: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(database.name);

  const updateThisDb = (mutator: (db: Database) => Database) =>
    setDatabases((prev) => prev.map((d) => (d.id === database.id ? mutator(d) : d)));

  const handleColumnLabelChange = (key: string, value: string) => {
    updateThisDb((db) => ({ ...db, columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c)) }));
  };

  const handleColumnTypeChange = (key: string, type: string) => {
    updateThisDb((db) => ({
      ...db,
      columns: db.columns.map((c) => (c.key === key ? { ...c, type } : c)),
      rows: db.rows.map((row) => ({
        ...row,
        properties: { ...row.properties, [key]: { value: row.properties[key]?.value || '', type } },
      })),
    }));
  };

  const handleValueChange = (rowId: string, key: string, value: any) => {
    updateThisDb((db) => ({
      ...db,
      rows: db.rows.map((row) => (row.id === rowId ? { ...row, properties: { ...row.properties, [key]: { ...row.properties[key], value } } } : row)),
    }));
  };

  const handleAddProperty = () => {
    if (!newPropertyName.trim()) return;
    const newKey = `${newPropertyName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    updateThisDb((db) => {
      const updatedColumns = [...db.columns, { key: newKey, label: newPropertyName.trim(), type: newPropertyType }];
      const updatedRows = db.rows.map((row) => ({ ...row, properties: { ...row.properties, [newKey]: { value: '', type: newPropertyType } } }));
      return { ...db, columns: updatedColumns, rows: updatedRows };
    });
    setNewPropertyName('');
    setNewPropertyType('text');
    setShowAddProperty(false);
  };

  const handleDeleteProperty = (key: string) => {
    setDeleteTarget({ type: 'column', id: key });
    setShowConfirmDelete(true);
  };

  const handleDeleteRow = (rowId: string) => {
    setDeleteTarget({ type: 'row', id: rowId });
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
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
      updateThisDb((db) => ({ ...db, rows: db.rows.filter((r) => r.id !== deleteTarget.id) }));
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleAddRow = () => {
    const newRow: DatabaseRow = {
      id: `row-${Date.now()}`,
      properties: Object.fromEntries(database.columns.map((col) => [col.key, { value: '', type: col.type }])),
    };
    updateThisDb((db) => ({ ...db, rows: [...db.rows, newRow] }));
  };

  const handleDatabaseNameChange = () => {
    if (editedName.trim() && editedName !== database.name) {
      updateThisDb((db) => ({ ...db, name: editedName.trim() }));
    } else setEditedName(database.name);
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDatabaseNameChange();
    if (e.key === 'Escape') {
      setEditedName(database.name);
      setIsEditingName(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 p-4 sm:p-6 lg:p-12 overflow-auto"
    >
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm h-full flex flex-col`}>
        <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleDatabaseNameChange}
                onKeyDown={handleNameKeyPress}
                autoFocus
                className={`text-lg sm:text-xl font-semibold ${
                  darkMode ? 'bg-gray-800 text-white' : 'text-gray-900'
                } border-b border-blue-400 focus:outline-none px-1`}
              />
            ) : (
              <>
                <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {database.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ml-2`}
                  title="Rename"
                >
                  <Pencil className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddProperty(true)}
              className={`px-3 py-1 rounded text-sm ${
                darkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-50 text-[#2563eb] hover:bg-blue-100'
              }`}
            >
              <Plus className="inline w-3 h-3 mr-1" /> Add Property
            </button>
            <button
              onClick={handleAddRow}
              className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
            >
              + Add Row
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <div className="p-4 overflow-x-auto">
            <table className="w-full table-auto min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className={`${darkMode ? 'bg-gray-0 border-gray-600' : 'bg-gray-0 border-gray-200'} border-b`}>
                  {database.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <input
                          value={col.label}
                          onChange={(e) => handleColumnLabelChange(col.key, e.target.value)}
                          className={`${
                            darkMode ? 'text-white' : 'text-gray-900'
                          } bg-transparent text-sm sm:text-base focus:outline-none border-0`}
                        />
                        <select
                          value={col.type}
                          onChange={(e) => handleColumnTypeChange(col.key, e.target.value)}
                          className={`text-xs sm:text-sm border rounded px-1 py-0.5 ${
                            darkMode ? 'bg-gray-600 text-white border-gray-600' : ''
                          }`}
                        >
                          {propertyTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteProperty(col.key)}
                          className={`${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                          title="Delete column"
                        >
                          🗑
                        </button>
                      </div>
                    </th>
                  ))}
                  <th
  className={`px-4 py-3 text-right ${
    darkMode ? 'text-white' : 'text-gray-900'
  }`}
>
  Actions
</th>

                </tr>
              </thead>

              <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-100'} divide-y`}>
                {database.rows.map((row) => (
                  <tr key={row.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    {database.columns.map((col) => {
                      const prop = row.properties[col.key];
                      if (!prop) return <td key={col.key} className="px-4 py-3"></td>;

                      switch (prop.type) {
                        case 'text':
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <input
                                type="text"
                                value={prop.value}
                                onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                                className={`w-full bg-transparent border rounded px-2 py-1 focus:outline-none text-sm ${
                                  darkMode ? 'border-gray-600 text-white' : 'border-gray-200'
                                }`}
                              />
                            </td>
                          );
                        case 'number':
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <input
                                type="number"
                                value={prop.value}
                                onChange={(e) => handleValueChange(row.id, col.key, e.target.valueAsNumber)}
                                className={`w-full bg-transparent border rounded px-2 py-1 focus:outline-none text-sm ${
                                  darkMode ? 'border-gray-600 text-white' : 'border-gray-200'
                                }`}
                              />
                            </td>
                          );
                        case 'date':
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <input
                                type="date"
                                value={prop.value}
                                onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                                className={`w-full bg-transparent border rounded px-2 py-1 focus:outline-none text-sm ${
                                  darkMode ? 'border-gray-600 text-white' : 'border-gray-200'
                                }`}
                              />
                            </td>
                          );
                        case 'checkbox':
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={!!prop.value}
                                onChange={(e) => handleValueChange(row.id, col.key, e.target.checked)}
                                className="h-4 w-4"
                              />
                            </td>
                          );
                        default:
                          return <td key={col.key} className="px-4 py-3" />;
                      }
                    })}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t flex items-center justify-between`}>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rows: {database.rows.length}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(database, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${database.name.replace(/\s+/g, '_')}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`px-3 py-1 text-sm rounded ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      <AnimatePresence>
        {showAddProperty && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddProperty(false)}
          >
            <motion.div
              className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Add Property</h3>
              <input
                type="text"
                placeholder="Property name"
                className={`w-full mb-3 border rounded px-3 py-2 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                }`}
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
              />
              <select
                className={`w-full mb-3 border rounded px-3 py-2 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                }`}
                value={newPropertyType}
                onChange={(e) => setNewPropertyType(e.target.value)}
              >
                {propertyTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddProperty(false)}
                  className={`px-4 py-2 border rounded ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button onClick={handleAddProperty} className="px-4 py-2 bg-blue-500 text-white rounded">
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirmDelete && deleteTarget && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 w-11/12 sm:w-96`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Delete {deleteTarget.type === 'column' ? 'column' : 'row'}?
              </h3>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className={`px-4 py-2 border rounded ${
                    darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ---------------- Team Notes ---------------- */
const TeamNotes = ({ darkMode }: { darkMode: boolean }) => {
  type Note = { id: string; text: string };

  const [todo, setTodo] = useState<Note[]>([
    { id: 't1', text: 'Design hero section' },
    { id: 't2', text: 'Write README' },
  ]);
  const [inProgress, setInProgress] = useState<Note[]>([{ id: 'p1', text: 'Implement auth' }]);
  const [done, setDone] = useState<Note[]>([{ id: 'd1', text: 'Init repo' }]);
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

/* ---------------- Main Dashboard ---------------- */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(menuItems[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    if (databases.length === 0) {
      const k = `title-${Date.now()}`;
      setDatabases([
        {
          id: `db-${Date.now()}`,
          name: 'New database 1',
          columns: [{ key: k, label: 'Name', type: 'text' }],
          rows: [
            { id: `row-1-${Date.now()}`, properties: { [k]: { value: 'Example row 1', type: 'text' } } },
            { id: `row-2-${Date.now()}`, properties: { [k]: { value: 'Example row 2', type: 'text' } } },
          ],
        },
      ]);
    }
  }, []);

  const handleCreateDatabase = () => {
    const colKey = `title-${Date.now()}`;
    const nextNumber = databases.length + 1;
    const newDb: Database = {
      id: `db-${Date.now()}`,
      name: `New database ${nextNumber}`,
      columns: [{ key: colKey, label: 'Name', type: 'text' }],
      rows: [
        { id: `row-1-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
        { id: `row-2-${Date.now()}`, properties: { [colKey]: { value: '', type: 'text' } } },
      ],
    };
    setDatabases((prev) => [...prev, newDb]);
    setSelectedDatabase(newDb.id);
  };

  const handleDeleteDatabase = (id: string) => {
    setDatabases((prev) => prev.filter((db) => db.id !== id));
    if (selectedDatabase === id) setSelectedDatabase(null);
  };

  const handleLogout = () => navigate('/auth');

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const currentDb = databases.find((d) => d.id === selectedDatabase) || null;

  return (
    <div className={`flex h-screen relative overflow-hidden ${darkMode ? 'bg-gray-900' : ''}`}>
      <Sidebar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onCreateDatabase={handleCreateDatabase}
        onDeleteDatabase={handleDeleteDatabase}
        selectedMenu={selectedMenu}
        onSelectMenu={setSelectedMenu}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} darkMode={darkMode} />

        <main className={`flex-1 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-slate-100'}`}>
          <AnimatePresence mode="wait">
            {!selectedDatabase ? (
              <TeamNotes key="notes" darkMode={darkMode} />
            ) : currentDb ? (
              <DatabaseTable key={currentDb.id} database={currentDb} setDatabases={setDatabases} darkMode={darkMode} />
            ) : (
              <motion.div key="empty" className="p-6">
                <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Selected database not found.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}