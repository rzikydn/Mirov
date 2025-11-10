// src/constants/propertyTypeIcons.tsx
// Property type icons mapping for database columns

import React from 'react';
import { Type, Hash, Calendar, CheckSquare } from 'lucide-react';

export const propertyTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="w-3 h-3" />,
  number: <Hash className="w-3 h-3" />,
  date: <Calendar className="w-3 h-3" />,
  checkbox: <CheckSquare className="w-3 h-3" />,
};
