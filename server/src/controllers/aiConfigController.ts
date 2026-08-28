import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { chatbotAiConfig } from '../db/schema';

/**
 * GET /api/chatbot/ai-config — Return saved AI config (API key, model, provider)
 * Used by the widget iframe to retrieve AI config for LLM calls.
 */
export const getAiConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [row] = await db.select().from(chatbotAiConfig).where(eq(chatbotAiConfig.id, 'default'));
    if (!row) {
      res.json({});
      return;
    }
    res.json({
      provider: row.provider,
      apiKey: row.apiKey,
      model: row.model,
      temperature: row.temperature ? parseFloat(String(row.temperature)) : 0.7,
      maxTokens: row.maxTokens || 2048,
      status: row.status || 'disconnected',
      timeZone: row.timeZone || 'Asia/Jakarta (WIB, GMT+7)',
      filterWords: row.filterWords || ['kata-kasar', 'promosi-ilegal'],
    });
  } catch (error: any) {
    console.error('[AI Config] GET error:', error.message);
    res.json({});
  }
};

/**
 * POST /api/chatbot/ai-config — Save/update AI config
 * Called from admin dashboard ApiIntegrationModal when saving config.
 */
export const saveAiConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, apiKey, model, temperature, maxTokens, status, timeZone, filterWords } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({ success: false, message: 'apiKey is required' });
      return;
    }

    const configData = {
      id: 'default',
      provider: provider || 'groq',
      apiKey: apiKey.replace(/["'\s]/g, '').trim(),
      model: model || 'openai/gpt-oss-120b',
      temperature: typeof temperature === 'number' ? String(temperature) : '0.70',
      maxTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      status: status || 'connected',
      timeZone: timeZone || 'Asia/Jakarta (WIB, GMT+7)',
      filterWords: Array.isArray(filterWords) ? filterWords : ['kata-kasar', 'promosi-ilegal'],
    };

    // Upsert: insert or update
    const [existing] = await db.select({ id: chatbotAiConfig.id }).from(chatbotAiConfig).where(eq(chatbotAiConfig.id, 'default'));
    if (existing) {
      await db.update(chatbotAiConfig).set(configData).where(eq(chatbotAiConfig.id, 'default'));
    } else {
      await db.insert(chatbotAiConfig).values(configData);
    }

    res.json({ success: true, config: { ...configData, temperature: parseFloat(configData.temperature) } });
  } catch (error: any) {
    console.error('[AI Config] POST error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
