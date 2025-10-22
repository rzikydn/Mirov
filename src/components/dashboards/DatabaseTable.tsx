// src/components/dashboards/DatabaseTable.tsx (Notion Style)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Image, FileText, Smile } from 'lucide-react';
import { Database, DatabaseRow } from '../../types/database';
import { propertyTypes } from '../../constants/dashboard';
import AddPropertyModal from './modals/AddPropertyModal';
import DeleteModal from './modals/DeleteModal';

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
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'row' | 'column'; id: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(database.name);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const updateThisDb = (mutator: (db: Database) => Database) =>
    setDatabases((prev) => prev.map((d) => (d.id === database.id ? mutator(d) : d)));

  const handleColumnLabelChange = (key: string, value: string) => {
    updateThisDb((db) => ({ 
      ...db, 
      columns: db.columns.map((c) => (c.key === key ? { ...c, label: value } : c)) 
    }));
  };

  const handleColumnTypeChange = (key: string, type: string) => {
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
      updateThisDb((db) => ({ 
        ...db, 
        rows: db.rows.filter((r) => r.id !== deleteTarget.id) 
      }));
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
    updateThisDb((db) => ({ ...db, rows: [...db.rows, newRow] }));
  };

  const handleDatabaseNameChange = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}
    >
      {/* Header - Notion Style */}
      <div className="px-8 sm:px-12 lg:px-24 pt-12 pb-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Smile className="w-4 h-4" />
            Add icon
          </button>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Image className="w-4 h-4" />
            Add cover
          </button>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <FileText className="w-4 h-4" />
            Add description
          </button>
        </div>

        {/* Title */}
        <div className="mb-8">
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
            <h1
              onClick={() => setIsEditingName(true)}
              className={`text-4xl font-bold cursor-text ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {database.name}
            </h1>
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

          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            New
          </button>
        </div>
      </div>

      {/* Table - Notion Style */}
      <div className="px-8 sm:px-12 lg:px-24">
        <div className={`border rounded-lg overflow-hidden ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className={`${darkMode ? 'bg-[#202020]' : 'bg-gray-50'}`}>
                {database.columns.map((col, index) => (
                  <th
                    key={col.key}
                    className={`text-left px-4 py-2 font-normal ${
                      index === 0 ? 'w-80' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 group">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aa
                      </span>
                      <input
                        value={col.label}
                        onChange={(e) => handleColumnLabelChange(col.key, e.target.value)}
                        className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300 bg-transparent' : 'text-gray-700 bg-transparent'
                        } border-0 focus:outline-none px-0 py-0`}
                        placeholder="Name"
                      />
                      <button
                        onClick={() => handleDeleteProperty(col.key)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                      >
                        <MoreHorizontal className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-12">
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
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className={`${darkMode ? 'divide-gray-800' : 'divide-gray-200'} divide-y`}>
              {database.rows.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`group ${
                    darkMode ? 'hover:bg-[#202020]' : 'hover:bg-gray-50'
                  }`}
                >
                  {database.columns.map((col) => {
                    const prop = row.properties[col.key];
                    if (!prop) return <td key={col.key} className="px-4 py-3"></td>;

                    return (
                      <td key={col.key} className="px-4 py-3">
                        {prop.type === 'text' && (
                          <input
                            type="text"
                            value={prop.value}
                            onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                            placeholder="Empty"
                            className={`w-full text-sm ${
                              darkMode 
                                ? 'bg-transparent text-gray-300 placeholder-gray-600' 
                                : 'bg-transparent text-gray-900 placeholder-gray-400'
                            } border-0 focus:outline-none px-0 py-0`}
                          />
                        )}
                        {prop.type === 'number' && (
                          <input
                            type="number"
                            value={prop.value}
                            onChange={(e) => handleValueChange(row.id, col.key, e.target.valueAsNumber)}
                            className={`w-full text-sm ${
                              darkMode 
                                ? 'bg-transparent text-gray-300' 
                                : 'bg-transparent text-gray-900'
                            } border-0 focus:outline-none px-0 py-0`}
                          />
                        )}
                        {prop.type === 'date' && (
                          <input
                            type="date"
                            value={prop.value}
                            onChange={(e) => handleValueChange(row.id, col.key, e.target.value)}
                            className={`w-full text-sm ${
                              darkMode 
                                ? 'bg-transparent text-gray-300' 
                                : 'bg-transparent text-gray-900'
                            } border-0 focus:outline-none px-0 py-0`}
                          />
                        )}
                        {prop.type === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={!!prop.value}
                            onChange={(e) => handleValueChange(row.id, col.key, e.target.checked)}
                            className="w-4 h-4"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    {hoveredRow === row.id && (
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

              {/* New Page Row */}
              <tr className={darkMode ? 'hover:bg-[#202020]' : 'hover:bg-gray-50'}>
                <td colSpan={database.columns.length + 1} className="px-4 py-3">
                  <button
                    onClick={handleAddRow}
                    className={`flex items-center gap-2 text-sm ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    New page
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
    </motion.div>
  );
};

export default DatabaseTable;