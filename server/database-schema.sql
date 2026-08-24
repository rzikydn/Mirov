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

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
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
CREATE TABLE IF NOT EXISTS `schedules` (
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
CREATE TABLE IF NOT EXISTS `notes` (
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
CREATE TABLE IF NOT EXISTS `databases` (
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
CREATE TABLE IF NOT EXISTS `history` (
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
('umumalfi', '$2b$10$NyNEOKvB.jnsPaKDd93UrekkSxQzRYyecS/lcIjNCyhGqg1vVz/WW', 'Alfi', 'UMUM', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

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
-- AI Chatbot Tables
-- ============================================

-- Table: chatbot_faqs
CREATE TABLE IF NOT EXISTS `chatbot_faqs` (
    `id` VARCHAR(100) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(20) DEFAULT '',
    `answer` TEXT NOT NULL,
    `category` VARCHAR(100) DEFAULT 'Umum',
    `sortOrder` INT DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_settings
CREATE TABLE IF NOT EXISTS `chatbot_settings` (
    `id` VARCHAR(50) NOT NULL DEFAULT 'default',
    `botName` VARCHAR(255) NOT NULL DEFAULT 'AI Assistant BSMR',
    `welcomeMsg` TEXT NOT NULL,
    `systemPrompt` TEXT NOT NULL,
    `waNumber` VARCHAR(50) NOT NULL DEFAULT '6281299008899',
    `adminEmail` VARCHAR(255) NOT NULL DEFAULT 'cs@bsmr.org',
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_sessions
CREATE TABLE IF NOT EXISTS `chatbot_sessions` (
    `id` VARCHAR(100) NOT NULL,
    `visitorId` VARCHAR(100) NOT NULL,
    `title` VARCHAR(500) NOT NULL DEFAULT 'Sesi Pengunjung Baru',
    `isEscalated` BOOLEAN NOT NULL DEFAULT false,
    `isUnread` BOOLEAN NOT NULL DEFAULT true,
    `lastSender` VARCHAR(50) DEFAULT 'user',
    `preview` TEXT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `chatbot_sessions_visitorId_idx` (`visitorId`),
    INDEX `chatbot_sessions_updatedAt_idx` (`updatedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_messages
CREATE TABLE IF NOT EXISTS `chatbot_messages` (
    `id` VARCHAR(100) NOT NULL,
    `sessionId` VARCHAR(100) NOT NULL,
    `sender` ENUM('user', 'bot', 'admin') NOT NULL,
    `text` TEXT NOT NULL,
    `time` VARCHAR(50) NOT NULL,
    `feedback` ENUM('HELPFUL', 'NOT_HELPFUL'),
    `isContactInfo` BOOLEAN DEFAULT false,
    `isEscalation` BOOLEAN DEFAULT false,
    `waNumber` VARCHAR(50),
    `adminEmail` VARCHAR(255),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `chatbot_messages_sessionId_idx` (`sessionId`),
    INDEX `chatbot_messages_createdAt_idx` (`createdAt`),
    FOREIGN KEY (`sessionId`) REFERENCES `chatbot_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: chatbot_analytics
CREATE TABLE IF NOT EXISTS `chatbot_analytics` (
    `id` VARCHAR(100) NOT NULL,
    `metricType` VARCHAR(100) NOT NULL,
    `dataJson` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Default FAQs & Settings
INSERT INTO `chatbot_settings` (`id`, `botName`, `welcomeMsg`, `systemPrompt`, `waNumber`, `adminEmail`, `updatedAt`)
VALUES ('default', 'AI Assistant BSMR', 'Halo! Selamat datang di Layanan AI BSMR (Badan Sertifikasi Manajemen Risiko). Ada yang bisa saya bantu terkait sertifikasi kompetensi kerja Anda?', 'Anda adalah AI Assistant Resmi untuk BSMR (Badan Sertifikasi Manajemen Risiko). Tugas utama Anda adalah memberikan informasi yang akurat, profesional, dan ramah seputar sertifikasi manajemen risiko perbankan di Indonesia. Gunakan bahasa Indonesia yang baku dan santun.', '6281299008899', 'cs@bsmr.org', NOW())
ON DUPLICATE KEY UPDATE `botName` = VALUES(`botName`);

INSERT INTO `chatbot_faqs` (`id`, `label`, `icon`, `answer`, `category`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
('cek-sertifikat', 'Cek Masa Berlaku Sertifikat', '', 'Untuk mengecek masa berlaku Sertifikat BSMR Anda, silakan ketikkan Nomor Sertifikat atau Tanggal/Tahun diterbitkannya sertifikat Anda (Contoh: 12/05/2023).', 'Sertifikasi', 1, NOW(), NOW()),
('apa-bsmr', 'Apa itu BSMR?', '', 'LSP BSMR (Badan Sertifikasi Manajemen Risiko) adalah lembaga sertifikasi profesi resmi di Indonesia yang menguji dan menerbitkan sertifikasi kompetensi manajemen risiko perbankan sesuai standar OJK dan BNSP.', 'Umum', 2, NOW(), NOW()),
('level-sertifikasi', 'Level Sertifikasi', '', 'BSMR menyelenggarakan sertifikasi Manajemen Risiko dari Level 1 (Tingkat Dasar/Staff) hingga Level 5 (Tingkat Eksekutif/Direksi).', 'Program', 3, NOW(), NOW()),
('cara-daftar', 'Cara Pendaftaran', '', 'Pendaftaran ujian dapat dilakukan secara online melalui portal bsmr.org pada menu \'Pendaftaran Ujian\' atau melalui PIC Bank pengirim.', 'Pendaftaran', 4, NOW(), NOW()),
('jadwal-lokasi', 'Jadwal & Lokasi', '', 'Jadwal Asesmen BSMR terdekat dilaksanakan pada 12-14 September 2026 secara Hybrid (Online via Computer Based Test & Offline di Kampus BSMR Jakarta).', 'Jadwal', 5, NOW(), NOW()),
('hubungi-bsmr', 'Hubungi BSMR', '', 'Anda dapat menghubungi Admin CS BSMR via WhatsApp atau Email resmi.', 'Kontak', 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`);

-- ============================================
-- Verification Queries (Run after import)
-- ============================================
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_schedules FROM schedules;
-- SELECT COUNT(*) as total_notes FROM notes;
-- SELECT COUNT(*) as total_faqs FROM chatbot_faqs;
-- SELECT * FROM chatbot_settings;
-- SHOW TABLES;

-- ============================================
-- End of Schema
-- ============================================
