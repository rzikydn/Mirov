import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';

interface DatabaseRow {
  id: string;
  name: string;
  properties: { [key: string]: { value: any; type: string } };
}

interface Database {
  id: string;
  name: string;
  rows: DatabaseRow[];
}

interface MenuItem {
  id: string;
  name: string;
}

const menuItems: MenuItem[] = [
  { id: '1', name: 'Product Ideas' },
  { id: '2', name: 'Sprint Planning' },
  { id: '3', name: 'Team Notes' },
];

const propertyTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
];

const Sidebar = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onCreateDatabase,
  selectedMenu,
  onSelectMenu,
}: {
  databases: Database[];
  selectedDatabase: string | null;
  onSelectDatabase: (id: string | null) => void;
  onCreateDatabase: () => void;
  selectedMenu: string | null;
  onSelectMenu: (id: string) => void;
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-semibold text-lg">
            M
          </div>
          <div>
            <div className="font-semibold text-gray-900">My Workspace</div>
          </div>
        </div>

        <nav className="space-y-1">
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
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex-1">
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
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                selectedDatabase === db.id
                  ? 'bg-blue-50 text-[#2563eb]'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-[#2563eb]'
              }`}
            >
              <ChevronRight className="w-3 h-3" />
              <span className="truncate">{db.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white border-b border-gray-200 px-12 py-6"
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
    className="p-12"
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

  const allPropertyKeys = Array.from(
    new Set(database.rows.flatMap((r) => Object.keys(r.properties)))
  );

  const handleAddProperty = () => {
    if (!newPropertyName) return;

    const updatedRows = database.rows.map((row) => ({
      ...row,
      properties: { ...row.properties, [newPropertyName]: { value: '', type: newPropertyType } },
    }));

    setDatabases((prev: Database[]) =>
      prev.map((db) => (db.id === database.id ? { ...db, rows: updatedRows } : db))
    );

    setNewPropertyName('');
    setNewPropertyType('text');
    setShowAddProperty(false);
  };

  const handleValueChange = (rowId: string, key: string, value: any) => {
    const updatedRows = database.rows.map((row) =>
      row.id === rowId
        ? { ...row, properties: { ...row.properties, [key]: { ...row.properties[key], value } } }
        : row
    );
    setDatabases((prev: Database[]) =>
      prev.map((db) => (db.id === database.id ? { ...db, rows: updatedRows } : db))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-12"
    >
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{database.name}</h2>
          <button
            onClick={() => setShowAddProperty(true)}
            className="text-sm text-gray-500 hover:text-[#2563eb] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                {allPropertyKeys.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {database.rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        setDatabases((prev: Database[]) =>
                          prev.map((db) =>
                            db.id === database.id
                              ? {
                                  ...db,
                                  rows: db.rows.map((r) =>
                                    r.id === row.id ? { ...r, name: e.target.value } : r
                                  ),
                                }
                              : db
                          )
                        )
                      }
                      placeholder="New page"
                      className="w-full bg-transparent border-none outline-none text-gray-900 focus:ring-0"
                    />
                  </td>
                  {allPropertyKeys.map((key) => {
                    const prop = row.properties[key];
                    if (!prop) return <td key={key}></td>;
                    switch (prop.type) {
                      case 'text':
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'number':
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={prop.value}
                              onChange={(e) =>
                                handleValueChange(row.id, key, Number(e.target.value))
                              }
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'date':
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'checkbox':
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={prop.value}
                              onChange={(e) => handleValueChange(row.id, key, e.target.checked)}
                              className="w-full border-none outline-none text-gray-700 focus:ring-0"
                            />
                          </td>
                        );
                      case 'select':
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={prop.value}
                              onChange={(e) => handleValueChange(row.id, key, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-700 focus:ring-0"
                            >
                              <option value="">Select</option>
                            </select>
                          </td>
                        );
                      default:
                        return <td key={key}></td>;
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowAddProperty(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={handleAddProperty}
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DashboardPage = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>('1');
  const [selectedMenu, setSelectedMenu] = useState<string | null>('1');
  const [dbCounter, setDbCounter] = useState(1);

  const handleCreateDatabase = () => {
    const newDb: Database = {
      id: `db-${Date.now()}`,
      name: `New database ${dbCounter}`,
      rows: [
        { id: `row-1-${Date.now()}`, name: 'New page', properties: {} },
        { id: `row-2-${Date.now()}`, name: '', properties: {} },
        { id: `row-3-${Date.now()}`, name: '', properties: {} },
      ],
    };
    setDatabases([...databases, newDb]);
    setDbCounter(dbCounter + 1);
    setSelectedDatabase(newDb.id);
  };

  const currentDatabase = databases.find((db) => db.id === selectedDatabase);

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans">
      <Sidebar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onCreateDatabase={handleCreateDatabase}
        selectedMenu={selectedMenu}
        onSelectMenu={setSelectedMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentDatabase ? (
              <DatabaseTable key={currentDatabase.id} database={currentDatabase} setDatabases={setDatabases} />
            ) : (
              <KanbanBoard key="kanban" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
