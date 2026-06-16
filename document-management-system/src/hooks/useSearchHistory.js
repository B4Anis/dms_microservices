import { useCallback } from 'react';

const MAX_SEARCHES = 10;
const STORAGE_KEY = 'dms_search_history';

/**
 * Custom hook to persist the last 10 search queries in localStorage.
 */
export function useSearchHistory() {
  const getSearchHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const addSearch = useCallback(
    (query) => {
      if (!query?.trim()) return;
      try {
        const history = getSearchHistory();
        const filtered = history.filter(
          q => q.toLowerCase() !== query.toLowerCase()
        );
        const updated = [query.trim(), ...filtered].slice(0, MAX_SEARCHES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [getSearchHistory]
  );

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Saved searches: named, persistent searches
  const getSavedSearches = useCallback(() => {
    try {
      const raw = localStorage.getItem('dms_saved_searches');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveSearch = useCallback((name, query) => {
    if (!name?.trim() || !query?.trim()) return;
    try {
      const saved = getSavedSearches();
      const filtered = saved.filter(s => s.name !== name);
      const updated = [{ name: name.trim(), query: query.trim(), savedAt: new Date().toISOString() }, ...filtered];
      localStorage.setItem('dms_saved_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [getSavedSearches]);

  const deleteSavedSearch = useCallback((name) => {
    try {
      const saved = getSavedSearches();
      const updated = saved.filter(s => s.name !== name);
      localStorage.setItem('dms_saved_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [getSavedSearches]);

  return {
    getSearchHistory,
    addSearch,
    clearHistory,
    getSavedSearches,
    saveSearch,
    deleteSavedSearch,
  };
}
