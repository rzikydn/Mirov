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
  id: string;
  name: string;
  rows: DatabaseRow[];
  columns: Column[];
}

export interface MenuItem {
  id: string;
  name: string;
}

export type Note = {
  id: string;
  text: string;
};