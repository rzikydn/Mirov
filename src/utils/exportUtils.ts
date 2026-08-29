// src/utils/exportUtils.ts
// Export utilities for database table

import ExcelJS from 'exceljs';
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
export const exportToXLSX = async (database: Database): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Add header row with column labels
  const headers = database.columns.map(col => col.label);
  const headerRow = worksheet.addRow(headers);

  // Style the header row
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' } // Dark blue background
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Set column widths
  database.columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = Math.max(col.label.length + 5, 15);
  });

  // Add data rows
  database.rows.forEach(row => {
    const rowData = database.columns.map(col => {
      const prop = row.properties[col.key];
      if (!prop) return '';

      if (prop.type === 'checkbox') {
        return prop.value ? 'Yes' : 'No';
      }

      if (prop.type === 'status') {
        return prop.value || '';
      }

      return prop.value || '';
    });

    const addedRow = worksheet.addRow(rowData);
    addedRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // Generate Excel file and download in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${database.name.replace(/\s+/g, '_').replace(/[^\w\s-]/g, '')}.xlsx`;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
