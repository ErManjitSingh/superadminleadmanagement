import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { useDataRefresh } from './useDataRefresh';

export function useSidebarCounts(enabled = true) {
  const [counts, setCounts] = useState(null);

  const load = useCallback(() => {
    API.get('/nav-counts', { skipSuccessToast: true })
      .then((res) => setCounts(res.data))
      .catch(() => setCounts(null));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    load();
    const interval = setInterval(load, 60_000);
    const onUnread = () => load();
    window.addEventListener('notifications:unread', onUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:unread', onUnread);
    };
  }, [enabled, load]);

  useDataRefresh(['nav-counts', '*'], load, enabled);

  return counts;
}
