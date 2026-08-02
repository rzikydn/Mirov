export interface PendingAction {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  description?: string;
}

const QUEUE_KEY = 'mirov_offline_pending_actions';

export function getCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`mirov_cache_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[offlineSync] Error reading cache for ${key}`, e);
  }
  return fallback;
}

export function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`mirov_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[offlineSync] Error saving cache for ${key}`, e);
  }
}

export function getPendingActions(): PendingAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function queueAction(action: Omit<PendingAction, 'id' | 'timestamp'>): void {
  const actions = getPendingActions();
  const method = action.method.toUpperCase();

  // If this is a PUT/PATCH to a database URL while a POST is pending
  if (method === 'PUT' || method === 'PATCH') {
    const postIndex = actions.findIndex(a => a.method.toUpperCase() === 'POST' && a.url.includes('/api/databases'));
    if (postIndex !== -1 && action.body) {
      try {
        const putPayload = JSON.parse(action.body);
        const postPayload = JSON.parse(actions[postIndex].body || '{}');

        const mergedPayload = {
          ...postPayload,
          name: putPayload.name || postPayload.name,
          columns: putPayload.columns || postPayload.columns,
          rows: putPayload.rows || postPayload.rows,
          description: putPayload.description !== undefined ? putPayload.description : postPayload.description,
          icon: putPayload.icon !== undefined ? putPayload.icon : postPayload.icon,
        };

        actions[postIndex].body = JSON.stringify(mergedPayload);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
        console.log(`[offlineSync] Merged offline database edit into pending POST action`);
        return;
      } catch {
        // Fallthrough if parsing fails
      }
    }
  }

  const newAction: PendingAction = {
    ...action,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  actions.push(newAction);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
  console.log(`[offlineSync] Queued action for sync: ${action.method} ${action.url}`);
}

export async function flushOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
  const actions = getPendingActions();
  if (actions.length === 0) return { syncedCount: 0, failedCount: 0 };

  console.log(`[offlineSync] Flushing ${actions.length} pending offline actions...`);
  const token = localStorage.getItem('token');

  let syncedCount = 0;
  let failedCount = 0;
  const remainingActions: PendingAction[] = [];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(act.headers || {}),
      };

      const res = await fetch(act.url, {
        method: act.method,
        headers,
        body: act.body,
      });

      if (res.ok) {
        syncedCount++;
        const resData = await res.json().catch(() => null);

        // Map temporary database ID to real server ID in remaining queued actions
        if (act.method.toUpperCase() === 'POST' && resData?.data?.id) {
          const newRealId = resData.data.id;
          for (let j = i + 1; j < actions.length; j++) {
            if (actions[j].url.includes('/api/databases/')) {
              actions[j].url = actions[j].url.replace(/\/api\/databases\/[^\/]+/, `/api/databases/${newRealId}`);
            }
          }
        }
      } else if (res.status === 404 || res.status === 400) {
        syncedCount++;
      } else {
        remainingActions.push(act);
        failedCount++;
      }
    } catch {
      remainingActions.push(act);
      failedCount++;
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingActions));
  console.log(`[offlineSync] Flush complete. Synced: ${syncedCount}, Failed: ${failedCount}`);
  return { syncedCount, failedCount };
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<{ ok: boolean; data: T | null; isOfflineFallback?: boolean }> {
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.ok) {
      const data = await res.json();
      if (cacheKey && method === 'GET') {
        setCache(cacheKey, data.data !== undefined ? data.data : data);
      }
      return { ok: true, data };
    }
    return { ok: false, data: null };
  } catch (err) {
    console.warn(`[offlineSync] Request failed for ${method} ${url}. Operating offline.`, err);

    if (method === 'GET' && cacheKey) {
      const cachedData = getCache<T | null>(cacheKey, null);
      if (cachedData !== null) {
        return { ok: true, data: { success: true, data: cachedData } as any, isOfflineFallback: true };
      }
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      queueAction({
        url,
        method,
        body: options.body as string,
        headers: options.headers as Record<string, string>,
      });
      return { ok: true, data: { success: true, offlineQueued: true } as any, isOfflineFallback: true };
    }

    return { ok: false, data: null, isOfflineFallback: true };
  }
}
