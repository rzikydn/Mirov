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
  avatar: text('avatar'),
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
  deletedAt: datetime('deletedAt', { mode: 'date', fsp: 3 }),
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
  deletedAt: datetime('deletedAt', { mode: 'date', fsp: 3 }),
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
  deletedAt: datetime('deletedAt', { mode: 'date', fsp: 3 }),
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

// Database Row Trash table (for soft-deleting individual rows inside a database grid)
export const databaseRowTrash = mysqlTable('database_row_trash', {
  id: int('id').primaryKey().autoincrement(),
  databaseId: int('databaseId').notNull(),
  databaseName: varchar('databaseName', { length: 255 }).notNull(),
  rowId: varchar('rowId', { length: 255 }).notNull(),
  rowData: json('rowData').notNull(),
  previewText: varchar('previewText', { length: 255 }).notNull(),
  deletedBy: int('deletedBy'),
  deletedAt: datetime('deletedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type DatabaseRowTrash = typeof databaseRowTrash.$inferSelect;
export type NewDatabaseRowTrash = typeof databaseRowTrash.$inferInsert;

// Enum type exports
export type Role = 'SUPERUSER' | 'ADMIN' | 'UMUM';
export type HistoryAction = 'CREATE' | 'EDIT' | 'DELETE';
export type HistoryTarget = 'NOTE' | 'DATABASE' | 'SCHEDULE';

// ==========================================
// 🤖 AI CHATBOT, RAG & MEMORY TABLES
// ==========================================

// 1. Chatbot Settings table
export const chatbotSettings = mysqlTable('chatbot_settings', {
  id: int('id').primaryKey().autoincrement(),
  botName: varchar('botName', { length: 255 }).notNull().default('BSMR AI Assistant'),
  welcomeMessage: text('welcomeMessage').notNull(),
  waNumber: varchar('waNumber', { length: 50 }).notNull().default('6281299008899'),
  systemPrompt: text('systemPrompt').notNull(),
  temperature: varchar('temperature', { length: 10 }).notNull().default('0.7'),
  modelName: varchar('modelName', { length: 100 }).notNull().default('gemini-1.5-flash'),
  autoEscalation: boolean('autoEscalation').notNull().default(true),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// 2. Chatbot FAQs table
export const chatbotFaqs = mysqlTable('chatbot_faqs', {
  id: int('id').primaryKey().autoincrement(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }).notNull().default('Umum'),
  hits: int('hits').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// 3. RAG Documents table
export const ragDocuments = mysqlTable('rag_documents', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  fileType: varchar('fileType', { length: 50 }).notNull().default('PDF'),
  category: varchar('category', { length: 100 }).notNull().default('Materi'),
  fileSize: varchar('fileSize', { length: 50 }),
  chunkCount: int('chunkCount').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('INDEXED'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// 4. RAG Chunks table (stores text chunks and JSON vector embeddings)
export const ragChunks = mysqlTable('rag_chunks', {
  id: int('id').primaryKey().autoincrement(),
  documentId: int('documentId').notNull().references(() => ragDocuments.id, { onDelete: 'cascade' }),
  chunkIndex: int('chunkIndex').notNull(),
  content: text('content').notNull(),
  embedding: json('embedding'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => ({
  documentIdx: index('rag_chunks_documentId_idx').on(table.documentId),
}));

// 5. Visitor Chat Sessions table
export const visitorChatSessions = mysqlTable('visitor_chat_sessions', {
  id: int('id').primaryKey().autoincrement(),
  sessionId: varchar('sessionId', { length: 255 }).notNull().unique(),
  visitorName: varchar('visitorName', { length: 255 }).notNull().default('Pengunjung BSMR'),
  visitorIp: varchar('visitorIp', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('SELF_SERVED'),
  messageCount: int('messageCount').notNull().default(0),
  startedAt: datetime('startedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  lastActive: datetime('lastActive', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
}, (table) => ({
  sessionIdIdx: index('visitor_chat_sessions_sessionId_idx').on(table.sessionId),
}));

// 6. Visitor Chat Messages table (Memory context window storage)
export const visitorChatMessages = mysqlTable('visitor_chat_messages', {
  id: int('id').primaryKey().autoincrement(),
  sessionId: varchar('sessionId', { length: 255 }).notNull(),
  sender: varchar('sender', { length: 50 }).notNull(),
  message: text('message').notNull(),
  metadata: json('metadata'),
  timestamp: datetime('timestamp', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => ({
  sessionIdIdx: index('visitor_chat_messages_sessionId_idx').on(table.sessionId),
}));

// 7. Chatbot Analytics Logs table
export const chatbotAnalyticsLogs = mysqlTable('chatbot_analytics_logs', {
  id: int('id').primaryKey().autoincrement(),
  logDate: varchar('logDate', { length: 20 }).notNull().unique(),
  totalInteractions: int('totalInteractions').notNull().default(0),
  solvedCount: int('solvedCount').notNull().default(0),
  escalatedCount: int('escalatedCount').notNull().default(0),
  outOfHoursCount: int('outOfHoursCount').notNull().default(0),
  peakHourCounts: json('peakHourCounts'),
  topQuestions: json('topQuestions'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// Infer types for AI Chatbot tables
export type ChatbotSettings = typeof chatbotSettings.$inferSelect;
export type NewChatbotSettings = typeof chatbotSettings.$inferInsert;

export type ChatbotFaq = typeof chatbotFaqs.$inferSelect;
export type NewChatbotFaq = typeof chatbotFaqs.$inferInsert;

export type RagDocument = typeof ragDocuments.$inferSelect;
export type NewRagDocument = typeof ragDocuments.$inferInsert;

export type RagChunk = typeof ragChunks.$inferSelect;
export type NewRagChunk = typeof ragChunks.$inferInsert;

export type VisitorChatSession = typeof visitorChatSessions.$inferSelect;
export type NewVisitorChatSession = typeof visitorChatSessions.$inferInsert;

export type VisitorChatMessage = typeof visitorChatMessages.$inferSelect;
export type NewVisitorChatMessage = typeof visitorChatMessages.$inferInsert;

export type ChatbotAnalyticsLog = typeof chatbotAnalyticsLogs.$inferSelect;
export type NewChatbotAnalyticsLog = typeof chatbotAnalyticsLogs.$inferInsert;
