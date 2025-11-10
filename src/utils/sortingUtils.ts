// src/utils/sortingUtils.ts
// Sorting utilities for database table

import { DatabaseRow, DatabaseColumn } from '../types/database';

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Compare function for sorting different data types
export const compareValues = (
  aValue: any,
  bValue: any,
  columnType: string,
  direction: 'asc' | 'desc'
): number => {
  if (columnType === 'number') {
    const aNum = parseFloat(aValue?.toString() || '0') || 0;
    const bNum = parseFloat(bValue?.toString() || '0') || 0;
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  }

  if (columnType === 'date') {
    const aDate = new Date(aValue?.toString() || '').getTime() || 0;
    const bDate = new Date(bValue?.toString() || '').getTime() || 0;
    return direction === 'asc' ? aDate - bDate : bDate - aDate;
  }

  if (columnType === 'checkbox') {
    const aBool = aValue ? 1 : 0;
    const bBool = bValue ? 1 : 0;
    return direction === 'asc' ? aBool - bBool : bBool - aBool;
  }

  // Default text comparison
  const aStr = (aValue?.toString() || '').toLowerCase();
  const bStr = (bValue?.toString() || '').toLowerCase();
  return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
};

// Get sorted rows with multi-level sorting
export const getSortedRows = (
  rows: DatabaseRow[],
  columns: DatabaseColumn[],
  sortConfig: SortConfig[]
): DatabaseRow[] => {
  if (sortConfig.length === 0) {
    return rows;
  }

  const sortedRows = [...rows].sort((a, b) => {
    // Apply sorts in order (first sort is primary, second is secondary, etc.)
    for (const sort of sortConfig) {
      const column = columns.find(col => col.key === sort.column);
      if (!column) continue;

      const aValue = a.properties[sort.column]?.value || '';
      const bValue = b.properties[sort.column]?.value || '';

      const comparison = compareValues(aValue, bValue, column.type, sort.direction);

      // If values are not equal, return the comparison result
      if (comparison !== 0) {
        return comparison;
      }
      // If equal, continue to next sort level
    }

    return 0; // All sort levels are equal
  });

  return sortedRows;
};

// Add or toggle sort
export const addSort = (
  sortConfig: SortConfig[],
  columnKey: string
): SortConfig[] => {
  const existingIndex = sortConfig.findIndex(s => s.column === columnKey);

  if (existingIndex >= 0) {
    // Toggle direction
    const newSortConfig = [...sortConfig];
    newSortConfig[existingIndex].direction =
      newSortConfig[existingIndex].direction === 'asc' ? 'desc' : 'asc';
    return newSortConfig;
  } else {
    // Add new sort
    return [...sortConfig, { column: columnKey, direction: 'asc' }];
  }
};

// Update sort direction at specific index
export const updateSortDirection = (
  sortConfig: SortConfig[],
  index: number,
  direction: 'asc' | 'desc'
): SortConfig[] => {
  const newSortConfig = [...sortConfig];
  newSortConfig[index].direction = direction;
  return newSortConfig;
};

// Delete specific sort
export const deleteSort = (
  sortConfig: SortConfig[],
  index: number
): SortConfig[] => {
  return sortConfig.filter((_, i) => i !== index);
};

// Clear all sorts
export const clearAllSorts = (): SortConfig[] => {
  return [];
};
