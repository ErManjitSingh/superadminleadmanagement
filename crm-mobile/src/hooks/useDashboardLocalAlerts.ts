import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { notifyLocalCrmEvent } from '@/src/hooks/usePushNotifications';
import type { DashboardData } from '@/src/types';

function todayKey(suffix: string) {
  const d = new Date();
  return `crm-local-alert:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}:${suffix}`;
}

async function onceToday(key: string, run: () => Promise<void>) {
  const storageKey = todayKey(key);
  const seen = await AsyncStorage.getItem(storageKey);
  if (seen) return;
  await run();
  await AsyncStorage.setItem(storageKey, '1');
}

export function useDashboardLocalAlerts(data?: DashboardData | null) {
  const ready = useRef(false);

  useEffect(() => {
    // Skip first paint noise right after login
    const t = setTimeout(() => {
      ready.current = true;
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready.current || !data?.kpis) return;

    const kpis = data.kpis;
    (async () => {
      if ((kpis.overdueFollowups || 0) > 0) {
        await onceToday('overdue', () =>
          notifyLocalCrmEvent({
            title: 'Overdue follow-ups',
            body: `${kpis.overdueFollowups} follow-ups need attention today.`,
            channelId: 'followups',
          })
        );
      }
      if ((kpis.hotLeads || 0) > 0) {
        await onceToday('hot', () =>
          notifyLocalCrmEvent({
            title: 'Hot leads waiting',
            body: `${kpis.hotLeads} hot leads are in your pipeline.`,
            channelId: 'leads',
          })
        );
      }
      if ((kpis.todayFollowups || 0) > 0) {
        await onceToday('today-fu', () =>
          notifyLocalCrmEvent({
            title: "Today's follow-ups",
            body: `You have ${kpis.todayFollowups} follow-ups scheduled today.`,
            channelId: 'followups',
          })
        );
      }
      if ((kpis.newLeadsToday || 0) > 0) {
        await onceToday('new-leads', () =>
          notifyLocalCrmEvent({
            title: 'New leads today',
            body: `${kpis.newLeadsToday} new leads arrived today.`,
            channelId: 'leads',
          })
        );
      }
    })().catch(() => undefined);
  }, [data]);
}
