import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  boolean,
  json,
  mysqlEnum,
  index
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Enums
export const roleEnum = mysqlEnum('role', ['SUPERUSER', 'ADMIN', 'UMUM']);
export const historyActionEnum = mysqlEnum('action', ['CREATE', 'EDIT', 'DELETE']);
export const historyTargetEnum = mysqlEnum('target', ['NOTE', 'DATABASE', 'SCHEDULE']);

// Users table
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum.notNull().default('UMUM'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// Schedules table
export const schedules = mysqlTable('schedules', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: datetime('startDate', { mode: 'date', fsp: 3 }).notNull(),
  endDate: datetime('endDate', { mode: 'date', fsp: 3 }).notNull(),
  location: varchar('location', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('planned'),
  createdBy: int('createdBy').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// Notes table
export const notes = mysqlTable('notes', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  color: varchar('color', { length: 50 }),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
  favorite: boolean('favorite').notNull().default(false),
});

// Databases table
export const databases = mysqlTable('databases', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  columns: json('columns').notNull(),
  rows: json('rows').notNull(),
  columnWidths: json('columnWidths'),
  createdBy: int('createdBy').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// History table
export const history = mysqlTable('history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: varchar('userName', { length: 255 }).notNull(),
  userRole: mysqlEnum('userRole', ['SUPERUSER', 'ADMIN', 'UMUM']).notNull(),
  action: mysqlEnum('action', ['CREATE', 'EDIT', 'DELETE']).notNull(),
  target: mysqlEnum('target', ['NOTE', 'DATABASE', 'SCHEDULE']).notNull(),
  targetName: varchar('targetName', { length: 255 }),
  description: text('description').notNull(),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => ({
  createdAtIdx: index('history_createdAt_idx').on(table.createdAt),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Database = typeof databases.$inferSelect;
export type NewDatabase = typeof databases.$inferInsert;

export type History = typeof history.$inferSelect;
export type NewHistory = typeof history.$inferInsert;

// Enum type exports
export type Role = 'SUPERUSER' | 'ADMIN' | 'UMUM';
export type HistoryAction = 'CREATE' | 'EDIT' | 'DELETE';
export type HistoryTarget = 'NOTE' | 'DATABASE' | 'SCHEDULE';
