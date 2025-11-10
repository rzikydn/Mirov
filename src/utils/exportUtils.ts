// src/utils/exportUtils.ts
// Export utilities for database table

import * as XLSX from 'xlsx';
import { Database } from '../types/database';

// Export database as JSON file
export const exportToJSON = (database: Database): void => {
  const dataStr = JSON.stringify(database, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${database.name.replace(/\s+/g, '_')}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export database as Excel file with formatting
export const exportToXLSX = (database: Database): void => {
  // Prepare data for Excel export
  const worksheetData: any[][] = [];

  // Add header row with column labels
  const headers = database.columns.map(col => col.label);
  worksheetData.push(headers);

  // Add data rows
  database.rows.forEach(row => {
    const rowData = database.columns.map(col => {
      const prop = row.properties[col.key];
      if (!prop) return '';

      if (prop.type === 'checkbox') {
        return prop.value ? 'Yes' : 'No';
      }

      return prop.value || '';
    });
    worksheetData.push(rowData);
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const columnWidths = database.columns.map(col => ({
    wch: Math.max(col.label.length + 5, 15) // Minimum 15 chars width
  }));
  worksheet['!cols'] = columnWidths;

  // Style the header row (first row)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;

    // Apply header styling
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '1F4E78' } }, // Dark blue background
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  // Style data cells with borders
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        border: {
          top: { style: 'thin', color: { rgb: 'D3D3D3' } },
          bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
          left: { style: 'thin', color: { rgb: 'D3D3D3' } },
          right: { style: 'thin', color: { rgb: 'D3D3D3' } }
        },
        alignment: { vertical: 'center' }
      };
    }
  }

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate Excel file and download
  const fileName = `${database.name.replace(/\s+/g, '_').replace(/[^\w\s-]/g, '')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
