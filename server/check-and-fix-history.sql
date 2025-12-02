-- Check current structure of history table
USE mirov_db;

-- Show current structure
DESCRIBE history;

-- If history table doesn't exist or has wrong structure, recreate it
DROP TABLE IF EXISTS history;

CREATE TABLE `history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `userName` varchar(255) NOT NULL,
  `userRole` enum('SUPERUSER','ADMIN','UMUM') NOT NULL,
  `action` enum('CREATE','EDIT','DELETE') NOT NULL,
  `target` enum('NOTE','DATABASE','SCHEDULE') NOT NULL,
  `targetName` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `history_createdAt_idx` (`createdAt`),
  KEY `userId` (`userId`),
  CONSTRAINT `history_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the structure
DESCRIBE history;
