import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { BrandingProvider, useBranding } from '@/src/context/BrandingContext';
import { BrandSplash } from '@/src/components/BrandSplash';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { colors } from '@/src/constants/theme';
import { queryClient, queryPersister } from '@/src/lib/queryClient';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function PushRegistration() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

function ConnectedSplash({ subtitle }: { subtitle?: string }) {
  const { branding } = useBranding();
  return (
    <BrandSplash
      title={branding.appTitle}
      logoUri={branding.logo}
      primaryColor={branding.primaryColor}
      subtitle={subtitle || branding.tagline || 'Lead Management'}
    />
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === 'login';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, inAuthGroup, router]);

  if (isLoading) {
    return <ConnectedSplash subtitle="Checking your secure session…" />;
  }
  if (!isAuthenticated && !inAuthGroup) {
    return <ConnectedSplash subtitle="Preparing login…" />;
  }
  if (isAuthenticated && inAuthGroup) {
    return <ConnectedSplash subtitle="Opening your CRM dashboard…" />;
  }
  return <>{children}</>;
}

function BootGate({ children }: { children: React.ReactNode }) {
  const [bootDone, setBootDone] = useState(false);
  const { isReady } = useBranding();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => setBootDone(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  if (!bootDone || !isReady) {
    return (
      <>
        <StatusBar style="light" />
        <ConnectedSplash />
      </>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ionicons: require('../assets/fonts/Ionicons.ttf'),
    Ionicons: require('../assets/fonts/Ionicons.ttf'),
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!fontsLoaded) {
    return (
      <>
        <StatusBar style="light" />
        <BrandSplash title="CRM" subtitle="Starting…" />
      </>
    );
  }

  return (
    <BrandingProvider>
      <BootGate>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: 1000 * 60 * 60 * 24,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                ['dashboard', 'leads', 'followups', 'lead', 'lead-notes', 'notifications-list'].some(
                  (key) => String(query.queryKey[0]).startsWith(key)
                ),
            },
          }}
        >
          <AuthProvider>
            <PushRegistration />
            <AuthGate>
              <StatusBar style="dark" />
              <OfflineBanner />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="login" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="notifications"
                  options={{
                    headerShown: true,
                    title: 'Notifications',
                    headerTintColor: colors.primary,
                    headerStyle: { backgroundColor: colors.surface },
                  }}
                />
                <Stack.Screen
                  name="lead/[id]"
                  options={{
                    headerShown: true,
                    title: 'Lead Details',
                    headerTintColor: colors.primary,
                    headerStyle: { backgroundColor: colors.surface },
                  }}
                />
                <Stack.Screen name="crm-web" options={{ headerShown: false }} />
                <Stack.Screen name="quotation/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="quotation/create" options={{ headerShown: false }} />
                <Stack.Screen name="lead/convert" options={{ headerShown: false }} />
              </Stack>
            </AuthGate>
          </AuthProvider>
        </PersistQueryClientProvider>
      </BootGate>
    </BrandingProvider>
  );
}
