import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';

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

const menuItems: MenuItem[] = [
  { id: '1', name: 'Product Ideas' },
];

const propertyTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
];

const Sidebar = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onCreateDatabase,
  onDeleteDatabase,
  selectedMenu,
  onSelectMenu,
}: {
  databases: Database[];
  selectedDatabase: string | null;
  onSelectDatabase: (id: string | null) => void;
  onCreateDatabase: () => void;
  onDeleteDatabase: (id: string) => void;
  selectedMenu: string | null;
  onSelectMenu: (id: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDbId, setDeleteDbId] = useState<string | null>(null);

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

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-lg">
            M
          </div>
          <div>
            <div className="font-semibold text-gray-900">My Workspace</div>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectMenu(item.id);
                onSelectDatabase(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                selectedMenu === item.id && !selectedDatabase
                  ? 'bg-blue-50 text-[#2563eb]'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Databases</span>
            <button
              onClick={onCreateDatabase}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="New Database"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-1">
            {databases.map((db) => (
              <button
                key={db.id}
                onClick={() => onSelectDatabase(db.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 group ${
                  selectedDatabase === db.id
                    ? 'bg-blue-50 text-[#2563eb]'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
                }`}
              >
                <ChevronRight className="w-3 h-3" />
                <span className="truncate flex-1">{db.name}</span>
                <button
                  onClick={(e) => handleDeleteClick(e, db.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  title="Delete database"
                >
                  <span className="text-red-500">🗑</span>
                </button>
              </button>
            ))}
          </div>
        </div>

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
                className="bg-white rounded-xl p-6 w-96"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Delete Database</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this database? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
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
      </div>
    </div>
  );
};

const Header = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white border-b border-gray-200 px-12 py-6 flex-shrink-0"
  >
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Product Roadmap Q4</h1>
        <p className="text-sm text-gray-500">Last edited 2 hours ago</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 border-white shadow-sm"></div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 border-white shadow-sm -ml-3"></div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 border-white shadow-sm -ml-3"></div>
      </div>
    </div>
  </motion.div>
);

const KanbanColumn = ({ title, count, color }: { title: string; count: number; color: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 min-w-[300px]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}>{count}</span>
    </div>
    <div className="space-y-3">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div
          key={i}
          className="h-24 bg-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        ></div>
      ))}
    </div>
  </div>
);

const KanbanBoard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="p-12 overflow-auto flex-1"
  >
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <KanbanColumn title="To Do" count={8} color="bg-gray-100 text-gray-700" />
      <KanbanColumn title="In Progress" count={3} color="bg-blue-100 text-[#2563eb]" />
      <KanbanColumn title="Done" count={5} color="bg-green-100 text-green-700" />
    </div>
  </motion.div>
);

const DatabaseTable = ({ database, setDatabases }: { database: Database; setDatabases: any }) => {
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('text');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'row' | 'column'; id: string } | null>(null);

  const handleColumnLabelChange = (key: string, value: string) => {
    setDatabases((prev: Database[]) =>
      prev.map((db) =>
        db.id === database.id
          ? { ...db, columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c)) }
          : db
      )
    );
  };

  const handleColumnTypeChange = (key: string, type: string) => {
    setDatabases((prev: Database[]) =>
      prev.map((db) =>
        db.id === database.id
          ? {
              ...db,
              columns: db.columns.map((c) => (c.key === key ? { ...c, type } : c)),
              rows: db.rows.map((row) => ({
                ...row,
                properties: { ...row.properties, [key]: { value: row.properties[key]?.value || '', type } },
              })),
            }
          : db
      )
    );
  };

  const handleValueChange = (rowId: string, key: string, value: any) => {
    setDatabases((prev: Database[]) =>
      prev.map((db) =>
        db.id === database.id
          ? {
              ...db,
              rows: db.rows.map((row) =>
                row.id === rowId ? { ...row, properties: { ...row.properties, [key]: { ...row.properties[key], value } } } : row
              ),
            }
          : db
      )
    );
  };

  const handleAddProperty = () => {
    if (!newPropertyName) return;

    const newKey = `${newPropertyName}-${Date.now()}`;
    const updatedColumns = [...database.columns, { key: newKey, label: newPropertyName, type: newPropertyType }];
    const updatedRows = database.rows.map((row) => ({
      ...row,
      properties: { ...row.properties, [newKey]: { value: '', type: newPropertyType } },
    }));

    setDatabases((prev: Database[]) =>
      prev.map((db) => (db.id === database.id ? { ...db, columns: updatedColumns, rows: updatedRows } : db))
    );

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
      const updatedColumns = database.columns.filter((c) => c.key !== deleteTarget.id);
      const updatedRows = database.rows.map((row) => {
        const newProps = { ...row.properties };
        delete newProps[deleteTarget.id];
        return { ...row, properties: newProps };
      });
      setDatabases((prev: Database[]) =>
        prev.map((db) => (db.id === database.id ? { ...db, columns: updatedColumns, rows: updatedRows } : db))
      );
    } else if (deleteTarget.type === 'row') {
      const updatedRows = database.rows.filter((r) => r.id !== deleteTarget.id);
      setDatabases((prev: Database[]) =>
        prev.map((db) => (db.id === database.id ? { ...db, rows: updatedRows } : db))
      );
    }

    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const handleAddRow = () => {
    const newRow: DatabaseRow = {
      id: `row-${Date.now()}`,
      properties: Object.fromEntries(
        database.columns.map((col) => [col.key, { value: '', type: col.type }])
      ),
    };
    setDatabases((prev: Database[]) =>
      prev.map((db) => (db.id === database.id ? { ...db, rows: [...db.rows, newRow] } : db))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 p-12"
    >
      <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{database.name}</h2>
          <button
            onClick={() => setShowAddProperty(true)}
            className="text-sm text-gray-500 hover:text-[#2563eb] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                {database.columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => handleColumnLabelChange(col.key, e.target.value)}
                        className="border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => handleColumnTypeChange(col.key, e.target.value)}
                        className="text-xs border-gray-300 rounded"
                      >
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {database.rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  {database.columns.map((col) => {
                    const prop = row.properties[col.key];
                    if (!prop) return <td key={col.key}></td>;
                    switch (prop.type) {
                      case 'text':
                        return (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'number':
                        return (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, col.key, Number(e.target.value))}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'date':
                        return (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'checkbox':
                        return (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={prop.value}
                              onChange={(e) => handleValueChange(row.id, col.key, e.target.checked)}
                              className="w-full border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'select':
                        return (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            >
                              <option value="">Select</option>
                            </select>
                          </td>
                        );
                      default:
                        return <td key={col.key}></td>;
                    }
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end">
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
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-center flex-shrink-0">
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + Add Row
          </button>
        </div>
      </div>

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
              className="bg-white rounded-xl p-6 w-96"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add Property</h3>
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
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddProperty(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProperty}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showConfirmDelete && deleteTarget && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-96"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="text-lg font-semibold mb-4">
                Are you sure you want to delete this {deleteTarget.type}?
              </h3>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
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
    </motion.div>
  );
};

export default function DashboardPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(menuItems[0].id);

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
    setDatabases([...databases, newDb]);
    setSelectedDatabase(newDb.id);
  };

  const handleDeleteDatabase = (id: string) => {
    setDatabases(databases.filter((db) => db.id !== id));
    if (selectedDatabase === id) {
      setSelectedDatabase(null);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onCreateDatabase={handleCreateDatabase}
        onDeleteDatabase={handleDeleteDatabase}
        selectedMenu={selectedMenu}
        onSelectMenu={setSelectedMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <div className="flex-1 relative overflow-hidden">
          {selectedDatabase ? (
            <DatabaseTable
              database={databases.find((db) => db.id === selectedDatabase)!}
              setDatabases={setDatabases}
            />
          ) : (
            <KanbanBoard />
          )}
        </div>
      </div>
    </div>
  );
}