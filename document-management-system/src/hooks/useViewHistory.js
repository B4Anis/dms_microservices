import { useCallback } from 'react';

const MAX_HISTORY = 20;

function getStorageKey(userId) {
  return `dms_view_history_${userId || 'anon'}`;
}

/**
 * Custom hook to manage document view history per user.
 * Stores the last 20 viewed document IDs in localStorage.
 *
 * @param {string|null} userId - Current user's ID (from useAuth)
 */
export function useViewHistory(userId) {
  const key = getStorageKey(userId);

  const getHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [key]);

  const addToHistory = useCallback(
    (docId) => {
      if (!docId) return;
      try {
        const history = getHistory();
        // Remove existing occurrence to avoid duplicates
        const filtered = history.filter(id => id !== docId);
        // Add to front (most recent first)
        const updated = [docId, ...filtered].slice(0, MAX_HISTORY);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // localStorage not available
      }
    },
    [key, getHistory]
  );

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return { getHistory, addToHistory, clearHistory };
}
