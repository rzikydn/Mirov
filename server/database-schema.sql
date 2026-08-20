-- ============================================
-- Database Schema for Mirov Application
-- MySQL Database
-- ============================================
--
-- Instructions:
-- 1. Create database: CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 2. Select database: USE mirov_db;
-- 3. Import this file via phpMyAdmin or: mysql -u username -p mirov_db < database-schema.sql
--
-- ============================================

-- Set character set
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS `history`;
DROP TABLE IF EXISTS `notes`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `databases`;
DROP TABLE IF EXISTS `users`;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPERUSER', 'ADMIN', 'UMUM') NOT NULL DEFAULT 'UMUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table: schedules
-- ============================================
CREATE TABLE `schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `location` VARCHAR(255),
    `status` VARCHAR(50) NOT NULL DEFAULT 'planned',
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table: notes
-- ============================================
CREATE TABLE `notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `color` VARCHAR(50),
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `favorite` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table: databases
-- ============================================
CREATE TABLE `databases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(100),
    `columns` JSON NOT NULL,
    `rows` JSON NOT NULL,
    `columnWidths` JSON,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table: history
-- ============================================
CREATE TABLE `history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `userName` VARCHAR(255) NOT NULL,
    `userRole` ENUM('SUPERUSER', 'ADMIN', 'UMUM') NOT NULL,
    `action` ENUM('CREATE', 'EDIT', 'DELETE') NOT NULL,
    `target` ENUM('NOTE', 'DATABASE', 'SCHEDULE') NOT NULL,
    `targetName` VARCHAR(255),
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `history_createdAt_idx`(`createdAt` DESC),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- AI Chatbot, RAG & Memory Tables
-- ============================================

-- Table: chatbot_settings
CREATE TABLE IF NOT EXISTS `chatbot_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `botName` VARCHAR(255) NOT NULL DEFAULT 'BSMR AI Assistant',
    `welcomeMessage` TEXT NOT NULL,
    `waNumber` VARCHAR(50) NOT NULL DEFAULT '6281299008899',
    `systemPrompt` TEXT NOT NULL,
    `temperature` VARCHAR(10) NOT NULL DEFAULT '0.7',
    `modelName` VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-flash',
    `autoEscalation` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_faqs
CREATE TABLE IF NOT EXISTS `chatbot_faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'Umum',
    `hits` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: rag_documents
CREATE TABLE IF NOT EXISTS `rag_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `fileType` VARCHAR(50) NOT NULL DEFAULT 'PDF',
    `category` VARCHAR(100) NOT NULL DEFAULT 'Materi',
    `fileSize` VARCHAR(50),
    `chunkCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL DEFAULT 'INDEXED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: rag_chunks
CREATE TABLE IF NOT EXISTS `rag_chunks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `chunkIndex` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `embedding` JSON,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `rag_chunks_documentId_idx`(`documentId`),
    FOREIGN KEY (`documentId`) REFERENCES `rag_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: visitor_chat_sessions
CREATE TABLE IF NOT EXISTS `visitor_chat_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(255) NOT NULL,
    `visitorName` VARCHAR(255) NOT NULL DEFAULT 'Pengunjung BSMR',
    `visitorIp` VARCHAR(100),
    `status` VARCHAR(50) NOT NULL DEFAULT 'SELF_SERVED',
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastActive` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `visitor_chat_sessions_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: visitor_chat_messages
CREATE TABLE IF NOT EXISTS `visitor_chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(255) NOT NULL,
    `sender` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `visitor_chat_messages_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_analytics_logs
CREATE TABLE IF NOT EXISTS `chatbot_analytics_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logDate` VARCHAR(20) NOT NULL,
    `totalInteractions` INTEGER NOT NULL DEFAULT 0,
    `solvedCount` INTEGER NOT NULL DEFAULT 0,
    `escalatedCount` INTEGER NOT NULL DEFAULT 0,
    `outOfHoursCount` INTEGER NOT NULL DEFAULT 0,
    `peakHourCounts` JSON,
    `topQuestions` JSON,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `chatbot_analytics_logs_logDate_key`(`logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Users (8 users)
-- ============================================
-- Note: All passwords are hashed with bcrypt
-- Default password format: <username without prefix>123
-- Examples:
--   - usertaufan -> taufan123
--   - adminagung -> agung123
--   - umumalfi -> alfi123

INSERT INTO `users` (`email`, `password`, `name`, `role`, `createdAt`, `updatedAt`) VALUES
-- SUPERUSER (3 users)
('usertaufan', '$2b$10$J0sglTGTDuN/FvLLB..XVOPTBc3wSxsQIM8LHg.aBDIwD7GTVynYC', 'Taufan', 'SUPERUSER', NOW(), NOW()),
('userhans', '$2b$10$IT/zvNjMJgju.5A9fkNk9uB8NUfoHt1dEY/MUyw73PaVXP.J765Da', 'Hans', 'SUPERUSER', NOW(), NOW()),
('userjelly', '$2b$10$bbS/WnUUjyvshwG3vdUASubT8YITYGOgy02NNLiECPZimCH8ifWaK', 'Jelly', 'SUPERUSER', NOW(), NOW()),

-- ADMIN (4 users)
('adminagung', '$2b$10$e4eYJtqnq7.KS5J1Pxf5NOQpftlPz7IAdvyLlbUyf/PZ7Fc1.v.6G', 'Agung', 'ADMIN', NOW(), NOW()),
('adminamin', '$2b$10$bEXoTklwdg4OSv8ecqKCSubUfwIMeFxCJGg8LMNzSK/rMZ7ndtxqK', 'Amin', 'ADMIN', NOW(), NOW()),
('adminsyaiful', '$2b$10$rCimkbIUAMB6i4pAbKHvCOO6R38TumgAnBAY3WTagj86JLaXAnLoS', 'Syaiful', 'ADMIN', NOW(), NOW()),
('admindea', '$2b$10$/VN5YhjucqY0a..EU0WoEOy4bPSDWw2aT6WdJximI4PxzJ9y7O2Z2', 'Dea', 'ADMIN', NOW(), NOW()),

-- UMUM (1 user)
('umumalfi', '$2b$10$NyNEOKvB.jnsPaKDd93UrekkSxQzRYyecS/lcIjNCyhGqg1vVz/WW', 'Alfi', 'UMUM', NOW(), NOW());

-- ============================================
-- Insert Sample Data (Optional)
-- ============================================

-- Sample Schedules (3 schedules)
INSERT INTO `schedules` (`title`, `description`, `startDate`, `endDate`, `location`, `status`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('Team Meeting', 'Weekly team sync meeting', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 'Conference Room A', 'planned', 1, NOW(), NOW()),
('Project Deadline', 'Final submission for Q4 project', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Office', 'planned', 1, NOW(), NOW()),
('Training Session', 'MySQL database training', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 'Training Room', 'planned', 4, NOW(), NOW());

-- Sample Notes (3 notes)
INSERT INTO `notes` (`title`, `content`, `color`, `userId`, `favorite`, `createdAt`, `updatedAt`) VALUES
('Welcome Note', 'Selamat datang di aplikasi Mirov! Ini adalah catatan pertama Anda.', '#FFD93D', 1, false, NOW(), NOW()),
('Database Migration', 'Database berhasil dimigrasikan dari PostgreSQL ke MySQL menggunakan XAMPP.', '#6BCB77', 4, true, NOW(), NOW()),
('Todo List', 'Things to do:\n1. Setup cPanel\n2. Deploy aplikasi\n3. Test semua fitur', '#FF6B9D', 8, false, NOW(), NOW());

-- ============================================
-- Verification Queries (Run after import)
-- ============================================
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_schedules FROM schedules;
-- SELECT COUNT(*) as total_notes FROM notes;
-- SELECT * FROM users;
-- SHOW TABLES;
-- DESCRIBE users;
-- DESCRIBE schedules;
-- DESCRIBE notes;
-- DESCRIBE databases;
-- DESCRIBE history;

-- ============================================
-- End of Schema
-- ============================================
