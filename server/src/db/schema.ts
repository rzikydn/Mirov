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

// RAG Document types
export const ragDocStatusEnum = mysqlEnum('status', ['UPLOADING', 'PROCESSING', 'INDEXED', 'ERROR']);
export const ragDocTypeEnum = mysqlEnum('type', ['PDF', 'DOCX', 'PPTX', 'FAQ']);

// RAG Documents table — uploaded files + FAQ entries
export const ragDocuments = mysqlTable('rag_documents', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 500 }).notNull(),
  type: mysqlEnum('type', ['PDF', 'DOCX', 'PPTX', 'FAQ']).notNull(),
  category: varchar('category', { length: 255 }),
  fileSize: int('fileSize'),
  totalChunks: int('totalChunks').default(0),
  status: mysqlEnum('status', ['UPLOADING', 'PROCESSING', 'INDEXED', 'ERROR']).notNull().default('UPLOADING'),
  errorMessage: text('errorMessage'),
  question: text('question'),
  answer: text('answer'),
  uploadedBy: int('uploadedBy'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

// RAG Chunks table — chunked text with embedding vectors
export const ragChunks = mysqlTable('rag_chunks', {
  id: int('id').primaryKey().autoincrement(),
  documentId: int('documentId').notNull(),
  chunkIndex: int('chunkIndex').notNull(),
  content: text('content').notNull(),
  heading: varchar('heading', { length: 500 }),
  pageOrSlide: int('pageOrSlide'),
  tokenCount: int('tokenCount'),
  embedding: json('embedding'), // float[] stored as JSON
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => ({
  documentIdx: index('rag_chunks_documentId_idx').on(table.documentId),
}));

export type RagDocument = typeof ragDocuments.$inferSelect;
export type NewRagDocument = typeof ragDocuments.$inferInsert;
export type RagChunk = typeof ragChunks.$inferSelect;
export type NewRagChunk = typeof ragChunks.$inferInsert;

// ==========================================
// AI CHATBOT TABLES (BSMR PRODUCTION)
// ==========================================

// Chatbot FAQs Table (Daftar FAQ & Jawaban Resmi)
export const chatbotFaqs = mysqlTable('chatbot_faqs', {
  id: varchar('id', { length: 100 }).primaryKey(),
  label: varchar('label', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 20 }).default(''),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }).default('Umum'),
  sortOrder: int('sortOrder').default(0),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

export type ChatbotFaq = typeof chatbotFaqs.$inferSelect;
export type NewChatbotFaq = typeof chatbotFaqs.$inferInsert;

// Chatbot Settings Table (System Prompt & Kontak Admin)
export const chatbotSettings = mysqlTable('chatbot_settings', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  botName: varchar('botName', { length: 255 }).notNull().default('AI Assistant BSMR'),
  welcomeMsg: text('welcomeMsg').notNull(),
  systemPrompt: text('systemPrompt').notNull(),
  waNumber: varchar('waNumber', { length: 50 }).notNull().default('6281299008899'),
  adminEmail: varchar('adminEmail', { length: 255 }).notNull().default('cs@bsmr.org'),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

export type ChatbotSetting = typeof chatbotSettings.$inferSelect;
export type NewChatbotSetting = typeof chatbotSettings.$inferInsert;

// Chatbot Visitor Sessions Table (Sesi Pengunjung)
export const chatbotSessions = mysqlTable('chatbot_sessions', {
  id: varchar('id', { length: 100 }).primaryKey(),
  visitorId: varchar('visitorId', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull().default('Sesi Pengunjung Baru'),
  isEscalated: boolean('isEscalated').notNull().default(false),
  isUnread: boolean('isUnread').notNull().default(true),
  lastSender: varchar('lastSender', { length: 50 }).default('user'),
  preview: text('preview'),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
}, (table) => ({
  visitorIdx: index('chatbot_sessions_visitorId_idx').on(table.visitorId),
  updatedAtIdx: index('chatbot_sessions_updatedAt_idx').on(table.updatedAt),
}));

export type ChatbotSession = typeof chatbotSessions.$inferSelect;
export type NewChatbotSession = typeof chatbotSessions.$inferInsert;

// Chatbot Messages Table (Riwayat Pesan Per Sesi)
export const chatbotMessages = mysqlTable('chatbot_messages', {
  id: varchar('id', { length: 100 }).primaryKey(),
  sessionId: varchar('sessionId', { length: 100 }).notNull().references(() => chatbotSessions.id, { onDelete: 'cascade' }),
  sender: mysqlEnum('sender', ['user', 'bot', 'admin']).notNull(),
  text: text('text').notNull(),
  time: varchar('time', { length: 50 }).notNull(),
  feedback: mysqlEnum('feedback', ['HELPFUL', 'NOT_HELPFUL']),
  isContactInfo: boolean('isContactInfo').default(false),
  isEscalation: boolean('isEscalation').default(false),
  waNumber: varchar('waNumber', { length: 50 }),
  adminEmail: varchar('adminEmail', { length: 255 }),
  createdAt: datetime('createdAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (table) => ({
  sessionIdx: index('chatbot_messages_sessionId_idx').on(table.sessionId),
  createdAtIdx: index('chatbot_messages_createdAt_idx').on(table.createdAt),
}));

export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type NewChatbotMessage = typeof chatbotMessages.$inferInsert;

// Chatbot Analytics Table (Statistik Agregasi)
export const chatbotAnalytics = mysqlTable('chatbot_analytics', {
  id: varchar('id', { length: 100 }).primaryKey(),
  metricType: varchar('metricType', { length: 100 }).notNull(), // 'interaction_count' | 'peak_hours' | 'top_questions'
  dataJson: json('dataJson').notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
});

export type ChatbotAnalytic = typeof chatbotAnalytics.$inferSelect;
export type NewChatbotAnalytic = typeof chatbotAnalytics.$inferInsert;

