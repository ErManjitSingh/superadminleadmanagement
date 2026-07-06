import { useEffect, useRef } from 'react';
import { DATA_CHANGED_EVENT, matchesDataKeys } from '../lib/dataRefresh';

/**
 * Refetch when any matching entity changes (same tab via axios, other tabs/users via socket).
 * @param {string|string[]} keys - e.g. ['leads', 'dashboard']
 * @param {() => void} onRefresh
 * @param {boolean} [enabled=true]
 * @param {number} [debounceMs=0] - debounce rapid refresh bursts
 */
export function useDataRefresh(keys, onRefresh, enabled = true, debounceMs = 0) {
  const keysRef = useRef(keys);
  const onRefreshRef = useRef(onRefresh);
  const debounceRef = useRef(null);
  keysRef.current = keys;
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return undefined;

    const triggerRefresh = () => {
      if (debounceMs > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          onRefreshRef.current?.();
        }, debounceMs);
        return;
      }
      onRefreshRef.current?.();
    };

    const handler = (event) => {
      const changed = event.detail?.keys;
      const watch = keysRef.current;
      const normalizedWatch = Array.isArray(watch) ? watch : [watch];
      const matched = normalizedWatch.some((w) => {
        if (typeof w === 'string' && w.startsWith('lead:')) {
          return changed?.includes(w) || changed?.includes('leads');
        }
        if (typeof w === 'string' && w.startsWith('booking:')) {
          return changed?.includes(w) || changed?.includes('operations');
        }
        return matchesDataKeys(w, changed);
      });
      if (matched) triggerRefresh();
    };

    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, debounceMs]);
}
