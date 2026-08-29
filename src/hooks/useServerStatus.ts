import { useState, useEffect, useCallback, useRef } from 'react';
import { flushOfflineQueue } from '@/services/offlineSync';

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

export function useServerStatus() {
  const [isBrowserOffline, setIsBrowserOffline] = useState(!navigator.onLine);
  const [isServerDown, setIsServerDown] = useState(false);
  const wasOfflineRef = useRef(false);

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) {
      setIsBrowserOffline(true);
      setIsServerDown(true);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      let res = await fetch(`${API_BASE}/health?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null);

      if (!res || !res.ok) {
        // Fallback check to /api/health for compatibility
        res = await fetch(`${API_BASE}/api/health?t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        }).catch(() => null);
      }

      clearTimeout(timeoutId);

      if (!res || !res.ok) {
        setIsServerDown(true);
      } else {
        setIsBrowserOffline(false);
        setIsServerDown(false);
      }
    } catch {
      setIsServerDown(true);
    }
  }, []);

  const isOffline = isBrowserOffline || isServerDown;

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Transitioned from offline -> online! Flush queue!
      wasOfflineRef.current = false;
      flushOfflineQueue().then((res) => {
        if (res.syncedCount > 0) {
          window.dispatchEvent(new CustomEvent('app:data-synced'));
        }
      });
    }
  }, [isOffline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOffline(false);
      checkServer();
    };

    const handleOffline = () => {
      setIsBrowserOffline(true);
      setIsServerDown(true);
    };

    const handleServerError = () => {
      setIsServerDown(true);
    };

    const handleServerSuccess = () => {
      setIsServerDown(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app:server-down', handleServerError);
    window.addEventListener('app:server-up', handleServerSuccess);

    // Initial check
    checkServer();

    // 10-second polling interval for clean, responsive status updates
    const interval = setInterval(checkServer, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app:server-down', handleServerError);
      window.removeEventListener('app:server-up', handleServerSuccess);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkServer]);

  return {
    isOffline,
    isServerDown,
    checkServer
  };
}
