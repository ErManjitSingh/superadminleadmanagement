import { useEffect, useRef } from 'react';
import { DATA_CHANGED_EVENT, matchesDataKeys } from '../lib/dataRefresh';

/**
 * Refetch when any matching entity changes (same tab via axios, other tabs/users via socket).
 * @param {string|string[]} keys - e.g. ['leads', 'dashboard']
 * @param {() => void} onRefresh
 * @param {boolean} [enabled=true]
 */
export function useDataRefresh(keys, onRefresh, enabled = true) {
  const keysRef = useRef(keys);
  const onRefreshRef = useRef(onRefresh);
  keysRef.current = keys;
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return undefined;

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
      if (matched) {
        onRefreshRef.current?.();
      }
    };

    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [enabled]);
}
