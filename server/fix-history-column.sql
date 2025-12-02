-- Fix history table column name from 'role' to 'userRole'
-- Run this in phpMyAdmin or MySQL command line

USE mirov_db;

-- Check if 'role' column exists (old schema)
-- If it exists, rename it to 'userRole'
ALTER TABLE history CHANGE COLUMN `role` `userRole` ENUM('SUPERUSER', 'ADMIN', 'UMUM') NOT NULL;

-- Verify the change
DESCRIBE history;
