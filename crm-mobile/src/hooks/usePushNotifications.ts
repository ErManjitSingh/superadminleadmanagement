import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { registerPushToken } from '@/src/services/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNELS = [
  {
    id: 'leads',
    name: 'New Leads',
    description: 'New lead assignments and hot lead alerts',
  },
  {
    id: 'followups',
    name: 'Follow-ups',
    description: 'Today and overdue follow-up reminders',
  },
  {
    id: 'quotations',
    name: 'Quotations',
    description: 'Quote sent, approved or rejected updates',
  },
  {
    id: 'default',
    name: 'CRM Alerts',
    description: 'General CRM notifications',
  },
] as const;

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  for (const channel of CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      description: channel.description,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      sound: 'default',
    });
  }
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') {
    console.warn('[push] Missing EAS projectId — push token registration skipped.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** Local CRM reminder — used when server push is unavailable. */
export async function notifyLocalCrmEvent(input: {
  title: string;
  body: string;
  channelId?: (typeof CHANNELS)[number]['id'];
}) {
  await ensureAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: input.channelId || 'default' } : {}),
    },
    trigger: null,
  });
}

export function usePushNotifications(enabled: boolean) {
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        await ensureAndroidChannels();
        const token = await getExpoPushToken();
        if (!token || token === registeredRef.current) return;
        await registerPushToken(token);
        registeredRef.current = token;
      } catch (error) {
        console.warn('[push] Registration failed:', error);
      }
    })();
  }, [enabled]);
}
