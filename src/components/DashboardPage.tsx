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
const menuItems: MenuItem[] = [{ id: '1', name: 'Product Ideas' }];

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
            className={`fixed lg:static z-40 top-0 left-0 w-64 bg-white border-r border-gray-200 h-full flex flex-col ${
              isOpen ? 'shadow-xl' : ''
            }`}
          >
            <div className="p-5 flex flex-col flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">My Workspace</div>
                  </div>
                </div>
                <button
                  className="lg:hidden p-1 rounded hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
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
                        ? 'bg-blue-50 text-[#2563eb]'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>

              <div className="mb-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-600">Databases</span>
                  <button
                    onClick={onCreateDatabase}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="New Database"
                    aria-label="Create database"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
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
                          ? 'bg-blue-50 text-[#2563eb]'
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

              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              className="bg-white rounded-xl p-6 w-11/12 sm:w-96"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Delete Database</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this database? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border rounded"
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
              className="bg-white rounded-xl p-6 w-11/12 sm:w-96"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Logout Confirmation</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 border rounded"
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
const Header = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-12 py-4 flex-shrink-0"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded hover:bg-gray-100"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0">Morning Team!</h1>
          <p className="text-xs sm:text-sm text-gray-500">Last edited 2 hours ago</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 border-white shadow-sm ${
              i !== 1 ? '-ml-3' : ''
            }`}
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
}: {
  database: Database;
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
}) => {
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('text');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'row' | 'column'; id: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(database.name);

  // update database within parent state
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
      <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleDatabaseNameChange}
                onKeyDown={handleNameKeyPress}
                autoFocus
                className="text-lg sm:text-xl font-semibold text-gray-900 border-b border-blue-400 focus:outline-none px-1"
              />
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{database.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded hover:bg-gray-100 ml-2"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddProperty(true)}
              className="px-3 py-1 rounded text-sm bg-blue-50 text-[#2563eb] hover:bg-blue-100"
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
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b">
                  {database.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <input
                          value={col.label}
                          onChange={(e) => handleColumnLabelChange(col.key, e.target.value)}
                          className="border-b border-gray-300 text-sm sm:text-base focus:outline-none"
                        />
                        <select
                          value={col.type}
                          onChange={(e) => handleColumnTypeChange(col.key, e.target.value)}
                          className="text-xs sm:text-sm border rounded px-1 py-0.5"
                        >
                          {propertyTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteProperty(col.key)}
                          className="text-gray-400 hover:text-red-500"
                          title="Delete column"
                        >
                          🗑
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {database.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
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
                                className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none text-sm"
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
                                className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none text-sm"
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
                                className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none text-sm"
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

        {/* Footer area */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">Rows: {database.rows.length}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // export JSON simple example
                const dataStr = JSON.stringify(database, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${database.name.replace(/\s+/g, '_')}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
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
              className="bg-white rounded-xl p-6 w-11/12 sm:w-96"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Add Property</h3>
              <input
                type="text"
                placeholder="Property name"
                className="w-full mb-3 border rounded px-3 py-2"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
              />
              <select
                className="w-full mb-3 border rounded px-3 py-2"
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
                <button onClick={() => setShowAddProperty(false)} className="px-4 py-2 border rounded">
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

      {/* Confirm Delete Modal (for column / row) */}
      <AnimatePresence>
        {showConfirmDelete && deleteTarget && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-11/12 sm:w-96"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Delete {deleteTarget.type === 'column' ? 'column' : 'row'}?
              </h3>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowConfirmDelete(false)} className="px-4 py-2 border rounded">
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

/* ---------------- Team Notes (Kanban with add note) ---------------- */
const TeamNotes = () => {
  type Note = { id: string; text: string };
  const [todo, setTodo] = useState<Note[]>([
    { id: 't1', text: 'Design hero section' },
    { id: 't2', text: 'Write README' },
  ]);
  const [inProgress, setInProgress] = useState<Note[]>([{ id: 'p1', text: 'Implement auth' }]);
  const [done, setDone] = useState<Note[]>([{ id: 'd1', text: 'Init repo' }]);
  const [newNote, setNewNote] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<'todo' | 'inProgress' | 'done'>('todo');

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = { id: `n-${Date.now()}`, text: newNote.trim() };
    if (selectedColumn === 'todo') setTodo((s) => [note, ...s]);
    if (selectedColumn === 'inProgress') setInProgress((s) => [note, ...s]);
    if (selectedColumn === 'done') setDone((s) => [note, ...s]);
    setNewNote('');
  };

  return (
    <motion.div className="p-4 sm:p-6 lg:p-12 overflow-auto flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Team Notes</h3>
        <div className="flex items-center gap-2">
          <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
            <option value="todo">To Do</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add note..." className="border rounded px-2 py-1 text-sm" />
          <button onClick={addNote} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Add</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm min-h-[120px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">To Do</h4>
            <span className="text-xs text-gray-600 px-2 py-0.5 rounded bg-gray-100">{todo.length}</span>
          </div>
          <div className="space-y-3">
            {todo.map((n) => (
              <div key={n.id} className="p-3 bg-gray-50 rounded">{n.text}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm min-h-[120px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">In Progress</h4>
            <span className="text-xs text-gray-600 px-2 py-0.5 rounded bg-gray-100">{inProgress.length}</span>
          </div>
          <div className="space-y-3">
            {inProgress.map((n) => (
              <div key={n.id} className="p-3 bg-gray-50 rounded">{n.text}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm min-h-[120px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Done</h4>
            <span className="text-xs text-gray-600 px-2 py-0.5 rounded bg-gray-100">{done.length}</span>
          </div>
          <div className="space-y-3">
            {done.map((n) => (
              <div key={n.id} className="p-3 bg-gray-50 rounded">{n.text}</div>
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

  // create default sample DB for first run (optional)
  React.useEffect(() => {
    if (databases.length === 0) {
      const k = `title-${Date.now()}`;
      setDatabases([
        {
          id: `db-${Date.now()}`,
          name: 'My Tasks',
          columns: [{ key: k, label: 'Name', type: 'text' }],
          rows: [
            { id: `row-1-${Date.now()}`, properties: { [k]: { value: 'Example row 1', type: 'text' } } },
            { id: `row-2-${Date.now()}`, properties: { [k]: { value: 'Example row 2', type: 'text' } } },
          ],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const currentDb = databases.find((d) => d.id === selectedDatabase) || null;

  return (
    <div className="flex h-screen relative overflow-hidden">
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
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 relative overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            {!selectedDatabase ? (
              // show Team Notes (kanban) by default when no DB selected
              <TeamNotes key="notes" />
            ) : currentDb ? (
              <DatabaseTable key={currentDb.id} database={currentDb} setDatabases={setDatabases} />
            ) : (
              <motion.div key="empty" className="p-6">
                <div className="text-gray-500">Selected database not found.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function handleLogout() {
  // placeholder for Sidebar logout modal usage - actual navigation handled in DashboardPage
  // kept so Sidebar's internal calls to handleLogout compile if moved around
  // This function intentionally left empty.
}
