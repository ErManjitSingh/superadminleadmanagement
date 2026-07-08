import { useCallback, useEffect, useState } from 'react';
import {
  dismissUpdate,
  fetchLatestBuildMeta,
  getCurrentBuildMeta,
  isUpdateDismissed,
  reloadApp,
} from '../lib/appVersion';

const POLL_INTERVAL_MS = 3 * 60 * 1000;

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentBuild, setCurrentBuild] = useState(() => getCurrentBuildMeta());
  const [latestBuild, setLatestBuild] = useState(null);

  const check = useCallback(async () => {
    if (import.meta.env.DEV) return;

    const current = getCurrentBuildMeta();
    setCurrentBuild(current);

    const latest = await fetchLatestBuildMeta();
    if (!latest?.buildId || latest.buildId === current.buildId) {
      setUpdateAvailable(false);
      setLatestBuild(null);
      return;
    }

    setLatestBuild(latest);
    setUpdateAvailable(!isUpdateDismissed(latest.buildId));
  }, []);

  useEffect(() => {
    check();

    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  const handleUpdate = () => reloadApp();

  const handleDismiss = () => {
    if (latestBuild?.buildId) dismissUpdate(latestBuild.buildId);
    setUpdateAvailable(false);
  };

  return { updateAvailable, currentBuild, latestBuild, handleUpdate, handleDismiss };
}
