-- Migration: Create chatbot_ai_config table
-- Stores AI LLM config (API key, provider, model) on server so widget visitors can access it

CREATE TABLE IF NOT EXISTS chatbot_ai_config (
  id VARCHAR(50) NOT NULL DEFAULT 'default' PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'groq',
  apiKey TEXT NOT NULL,
  model VARCHAR(255) NOT NULL DEFAULT 'openai/gpt-oss-120b',
  temperature DECIMAL(3,2) DEFAULT 0.70,
  maxTokens INT DEFAULT 2048,
  status VARCHAR(50) DEFAULT 'disconnected',
  timeZone VARCHAR(100) DEFAULT 'Asia/Jakarta (WIB, GMT+7)',
  filterWords JSON,
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
