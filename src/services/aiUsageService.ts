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
        const groqTokens = parsed.byProvider?.groq || parsed.totalTokensUsed || 0;
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

/**
 * Fetch authoritative usage stats from MySQL database server
 */
export async function fetchAiUsageStatsAsync(): Promise<AiUsageStats> {
  const local = getAiUsageStats();
  const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

  try {
    const res = await fetch(`${API_BASE}/api/chatbot/analytics?metricType=ai_usage`);
    if (res.ok) {
      const data = await res.json();
      const record = Array.isArray(data?.data) ? data.data.find((d: any) => d.metricType === 'ai_usage') : null;
      if (record && record.dataJson) {
        const s = record.dataJson;
        const serverTokens = s.totalTokensUsed || s.groqTokens || 0;
        const maxTokens = Math.max(local.totalTokensUsed, serverTokens);
        const maxRequests = Math.max(local.totalRequests, s.totalRequests || 0);

        const merged: AiUsageStats = {
          ...local,
          totalTokensUsed: maxTokens,
          totalRequests: maxRequests,
          byProvider: {
            ...local.byProvider,
            groq: maxTokens,
          },
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {}

  return local;
}

/**
 * Record token consumption in local storage & sync to database
 */
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

    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'BSMR_AI_USAGE_UPDATED', stats: updated }, '*');
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'BSMR_AI_USAGE_UPDATED', stats: updated }, '*');
        } catch (e) {}
      }
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_ai_usage_channel');
          channel.postMessage({ type: 'BSMR_AI_USAGE_UPDATED', stats: updated });
          // Note: don't close channel immediately so browser dispatches the message reliably
          setTimeout(() => { try { channel.close(); } catch (e) {} }, 1000);
        } catch (e) {}
      }
    }
  } catch (e) {}

  // Asynchronous sync to MySQL server database
  const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';
  fetch(`${API_BASE}/api/chatbot/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'ai_usage_stats',
      metricType: 'ai_usage',
      dataJson: {
        totalTokensUsed: updated.totalTokensUsed,
        totalRequests: updated.totalRequests,
        groqTokens: updated.byProvider.groq,
        byProvider: updated.byProvider,
      },
    }),
  }).catch(() => {});

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

  const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';
  fetch(`${API_BASE}/api/chatbot/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'ai_usage_stats',
      metricType: 'ai_usage',
      dataJson: {
        totalTokensUsed: 0,
        totalRequests: 0,
        groqTokens: 0,
        byProvider: { gemini: 0, deepseek: 0, groq: 0, openai: 0 },
      },
    }),
  }).catch(() => {});

  return fresh;
}
