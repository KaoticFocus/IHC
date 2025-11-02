import { useMemo, useCallback } from 'react';
import { useState, useEffect } from 'react';

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for memoized search/filter functionality
 */
export function useSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceMs: number = 300
): T[] {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const lowerSearch = debouncedSearchTerm.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);
}

/**
 * Hook for tracking recent items
 */
export function useRecentItems<T extends { id: string }>(
  key: string,
  maxItems: number = 10
): {
  recentItems: T[];
  addRecentItem: (item: T) => void;
  clearRecentItems: () => void;
} {
  const [recentItems, setRecentItems] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentItem = useCallback(
    (item: T) => {
      setRecentItems((prev) => {
        const filtered = prev.filter((i) => i.id !== item.id);
        const updated = [item, ...filtered].slice(0, maxItems);
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      });
    },
    [key, maxItems]
  );

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    localStorage.removeItem(key);
  }, []);

  return { recentItems, addRecentItem, clearRecentItems };
}


