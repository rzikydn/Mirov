// src/types/database.ts

export interface Property {
  value: any;
  type: string;
}

export interface DatabaseRow {
  id: string;
  properties: { [key: string]: Property };
}

export interface Column {
  key: string;
  label: string;
  type: string;
}

export interface Database {
  id: string | number;
  name: string;
  icon?: string; // ✨ Added for emoji icon
  cover?: string; // ✨ Added for cover image URL
  description?: string; // ✨ Added for database description
  rows: DatabaseRow[];
  columns: Column[];
  columnWidths?: Record<string, number>; // ✨ Added for persisting column widths
}

export interface MenuItem {
  id: string;
  name: string;
}

export type Note = {
  id: string;
  text: string;
  color?: string; // ✨ Added for note card background color
  date?: string; // ✨ Added for note creation/edit date
  favorite?: boolean; // ✨ Added for favorite/starred notes
};