// src/constants/dashboard.ts

import { MenuItem } from '../types/database';

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Team Notes' },
  { id: '2', name: 'Calendar' }
];

export const propertyTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
];