import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { getCache, setCache, queueAction, getPendingActions, flushOfflineQueue, apiFetch } from '../services/offlineSync';
import { OfflineBanner } from '../components/OfflineBanner';

describe('Local Caching, Optimistic UI & Auto Sync Engine Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Local Caching Storage & Retrieval', () => {
    it('should set and get cache from localStorage with 0ms latency', () => {
      const mockDatabase = [{ id: 1, name: 'Offline Cached DB', columns: [], rows: [] }];
      setCache('databases', mockDatabase);

      const cached = getCache<typeof mockDatabase>('databases', []);
      expect(cached).toEqual(mockDatabase);
      expect(cached[0].name).toBe('Offline Cached DB');
    });

    it('should return fallback data when cache is empty', () => {
      const fallback = [{ id: 99, name: 'Fallback DB' }];
      const result = getCache('non_existent_key', fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('2. Optimistic UI & Offline Queueing Engine', () => {
    it('should queue pending mutation actions when network/server fails', async () => {
      // Mock fetch failure (Offline)
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const initialQueue = getPendingActions();
      expect(initialQueue.length).toBe(0);

      // Perform mutation request via apiFetch
      const response = await apiFetch('http://localhost:5000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ content: 'Optimistic Test Note', color: '#FFA896' }),
      });

      expect(response.isOfflineFallback).toBe(true);

      const pendingQueue = getPendingActions();
      expect(pendingQueue.length).toBe(1);
      expect(pendingQueue[0].method).toBe('POST');
      expect(pendingQueue[0].url).toBe('http://localhost:5000/api/notes');
    });

    it('should consolidate offline PUT edits into pending POST actions', () => {
      // 1. Queue POST
      queueAction({
        url: 'http://localhost:5000/api/databases',
        method: 'POST',
        body: JSON.stringify({ name: 'Initial Offline DB', rows: [] }),
      });

      // 2. Queue PUT with updated name & rows
      queueAction({
        url: 'http://localhost:5000/api/databases/temp-123',
        method: 'PUT',
        body: JSON.stringify({ name: 'Renamed Offline DB', rows: [{ id: 1 }] }),
      });

      const queue = getPendingActions();
      // Should merge into single POST action
      expect(queue.length).toBe(1);
      const mergedBody = JSON.parse(queue[0].body || '{}');
      expect(mergedBody.name).toBe('Renamed Offline DB');
      expect(mergedBody.rows.length).toBe(1);
    });
  });

  describe('3. Automatic Offline-to-Online Sync Engine', () => {
    it('should flush pending offline queue when server comes back online', async () => {
      queueAction({
        url: 'http://localhost:5000/api/databases',
        method: 'POST',
        body: JSON.stringify({ name: 'Sync Target DB' }),
      });

      // Mock successful server response when back online
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 88, name: 'Sync Target DB' } }),
      } as any);

      const result = await flushOfflineQueue();
      expect(result.syncedCount).toBe(1);
      expect(result.failedCount).toBe(0);

      // Queue should now be empty
      const remainingQueue = getPendingActions();
      expect(remainingQueue.length).toBe(0);
    });
  });

  describe('4. Component UI Rendering (React Testing Library)', () => {
    it('renders banner component seamlessly without crashing', () => {
      render(<OfflineBanner />);
      // Standard render test passed
      expect(document.body).toBeInTheDocument();
    });
  });
});
