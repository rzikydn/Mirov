// Centralized Avatar Resolution & Locking Service

const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';
const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';
const STORAGE_KEY = 'global_used_avatars';

let cachedAvatarMap: Record<string, string> = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
})();

export const checkAvatarMatch = (optionUrl?: string | null, targetAvatarUrl?: string | null): boolean => {
  if (!optionUrl || !targetAvatarUrl) return false;
  if (optionUrl === targetAvatarUrl) return true;
  try {
    const u1 = new URL(optionUrl);
    const u2 = new URL(targetAvatarUrl);
    const seed1 = u1.searchParams.get('seed');
    const seed2 = u2.searchParams.get('seed');
    return Boolean(seed1 && seed2 && seed1.toLowerCase() === seed2.toLowerCase());
  } catch {
    return false;
  }
};

export const getUserAvatarsMap = (): Record<string, string> => {
  return { ...cachedAvatarMap };
};

export const fetchAndCacheUserAvatars = async (): Promise<Record<string, string>> => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/api/auth/avatars`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const newMap: Record<string, string> = {};
        for (const item of result.data) {
          if (item.name && item.avatar) {
            newMap[item.name] = item.avatar;
            newMap[item.name.toLowerCase()] = item.avatar;
          }
        }
        cachedAvatarMap = newMap;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
        } catch {}
        return newMap;
      }
    }
  } catch (e) {
    console.error('Failed to fetch user avatars map:', e);
  }
  return cachedAvatarMap;
};

export const getUserAvatar = (userName?: string, directAvatarUrl?: string): string => {
  // 1. Direct explicit avatar URL from DB / payload
  if (directAvatarUrl && typeof directAvatarUrl === 'string' && directAvatarUrl.trim() !== '') {
    return directAvatarUrl;
  }

  // 2. Check current logged-in user if name matches
  try {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      const currentUser = JSON.parse(storedUserStr);
      if (
        currentUser &&
        currentUser.avatar &&
        userName &&
        (currentUser.name === userName || currentUser.name?.toLowerCase() === userName?.toLowerCase())
      ) {
        return currentUser.avatar;
      }
    }
  } catch {}

  // 3. Check global cached avatar map
  if (userName) {
    if (cachedAvatarMap[userName]) {
      return cachedAvatarMap[userName];
    }
    if (cachedAvatarMap[userName.toLowerCase()]) {
      return cachedAvatarMap[userName.toLowerCase()];
    }

    // Check localStorage fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[userName]) return parsed[userName];
        if (parsed[userName.toLowerCase()]) return parsed[userName.toLowerCase()];
      }
    } catch {}
  }

  // 4. Default fallback with clean parameters
  const seed = userName ? encodeURIComponent(userName) : 'User';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4${safeParams}`;
};

// Initial sync on module load
if (typeof window !== 'undefined') {
  fetchAndCacheUserAvatars();
  window.addEventListener('userAvatarUpdated', () => {
    fetchAndCacheUserAvatars();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === 'user') {
      fetchAndCacheUserAvatars();
    }
  });
}
