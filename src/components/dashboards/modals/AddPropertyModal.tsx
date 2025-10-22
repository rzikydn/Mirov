// src/components/dashboards/modals/AddPropertyModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyTypes } from '../../../constants/dashboard';

interface AddPropertyModalProps {
  show: boolean;
  darkMode: boolean;
  onAdd: (name: string, type: string) => void;
  onCancel: () => void;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  show,
  darkMode,
  onAdd,
  onCancel,
}) => {
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('text');

  const handleAdd = () => {
    if (propertyName.trim()) {
      onAdd(propertyName.trim(), propertyType);
      setPropertyName('');
      setPropertyType('text');
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
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
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
            />
            <select
              className={`w-full mb-3 border rounded px-3 py-2 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
              }`}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              {propertyTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className={`px-4 py-2 border rounded ${
                  darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded">
                Add
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPropertyModal;