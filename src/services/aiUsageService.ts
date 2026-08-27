// AI Usage & Token Tracking Service for Mirov BSMR AI Chatbot
export interface AiUsageStats {
  totalTokensUsed: number;
  totalRequests: number;
  dataPlanTokens: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysLeft: number;
  byProvider: {
    gemini: number;
    deepseek: number;
    groq: number;
    openai: number;
  };
}

const STORAGE_KEY = 'mirov_ai_usage_stats';
const DEFAULT_QUOTA = 1000000; // 1,000,000 tokens default monthly quota

export function getAiUsageStats(): AiUsageStats {
  const now = new Date();
  const startStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  const endStr = `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${String(nextMonth.getFullYear()).slice(-2)}`;
  
  const diffTime = nextMonth.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy mock data
      if (parsed.totalTokensUsed === 12450 && parsed.byProvider?.gemini === 8200) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const groqTokens = parsed.byProvider?.groq || 0;
        return {
          totalTokensUsed: groqTokens,
          totalRequests: parsed.totalRequests || 0,
          dataPlanTokens: parsed.dataPlanTokens || DEFAULT_QUOTA,
          currentPeriodStart: parsed.currentPeriodStart || startStr,
          currentPeriodEnd: parsed.currentPeriodEnd || endStr,
          daysLeft: typeof parsed.daysLeft === 'number' ? parsed.daysLeft : daysLeft,
          byProvider: {
            gemini: 0,
            deepseek: 0,
            groq: groqTokens,
            openai: 0,
          },
        };
      }
    }
  } catch (e) {}

  // Initialize with 0 usage
  return {
    totalTokensUsed: 0,
    totalRequests: 0,
    dataPlanTokens: DEFAULT_QUOTA,
    currentPeriodStart: startStr,
    currentPeriodEnd: endStr,
    daysLeft,
    byProvider: {
      gemini: 0,
      deepseek: 0,
      groq: 0,
      openai: 0,
    },
  };
}

export function recordAiUsage(
  provider: 'gemini' | 'deepseek' | 'groq' | 'openai',
  tokensUsed: number
): AiUsageStats {
  const current = getAiUsageStats();
  const actualTokens = Math.max(tokensUsed, 50); // Minimum 50 tokens per query

  const updated: AiUsageStats = {
    ...current,
    totalTokensUsed: current.totalTokensUsed + actualTokens,
    totalRequests: current.totalRequests + 1,
    byProvider: {
      ...current.byProvider,
      [provider]: (current.byProvider[provider] || 0) + actualTokens,
    },
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mirov_ai_usage_updated', { detail: updated }));
  } catch (e) {}

  return updated;
}

export function resetAiUsage(): AiUsageStats {
  const fresh = {
    ...getAiUsageStats(),
    totalTokensUsed: 0,
    totalRequests: 0,
    byProvider: { gemini: 0, deepseek: 0, groq: 0, openai: 0 },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    window.dispatchEvent(new CustomEvent('mirov_ai_usage_updated', { detail: fresh }));
  } catch (e) {}
  return fresh;
}
