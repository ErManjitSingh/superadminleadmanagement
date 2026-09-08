import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { resolveCrmWebOrigin } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import {
  buildAuthBridgeHtml,
  buildAuthReinjectScript,
  buildCrmUrl,
  buildDesktopViewportScript,
} from '@/src/lib/crmWeb';

const PURPLE = '#7C3AED';

export default function CrmWebScreen() {
  const params = useLocalSearchParams<{ path?: string | string[]; title?: string | string[] }>();
  const path = Array.isArray(params.path) ? params.path[0] : params.path;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;
  const { token, user, tenantSubdomain } = useAuth();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeKey, setBridgeKey] = useState(0);

  const isQuoteBuilder = /quotation/i.test(String(path || ''));
  const targetUrl = useMemo(() => buildCrmUrl(path || '/'), [path]);
  const bridgeHtml = useMemo(() => {
    if (!token || !user) return '';
    return buildAuthBridgeHtml(token, user, targetUrl, tenantSubdomain || undefined);
  }, [token, user, targetUrl, tenantSubdomain, bridgeKey]);

  const reinject = useMemo(() => {
    if (!token || !user) return 'true;';
    const auth = buildAuthReinjectScript(token, user, tenantSubdomain || undefined);
    const desktop = isQuoteBuilder ? buildDesktopViewportScript() : 'true;';
    return `${auth}\n${desktop}`;
  }, [token, user, tenantSubdomain, isQuoteBuilder]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setBridgeKey((k) => k + 1);
  }, [path]);

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Please login again to open CRM pages.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (canGoBack) webRef.current?.goBack();
            else router.back();
          }}
          style={styles.iconBtn}
        >
          <AppIcon name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title || (isQuoteBuilder ? 'Quotation Builder' : 'CRM')}
        </Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            setBridgeKey((k) => k + 1);
          }}
          style={styles.iconBtn}
        >
          <AppIcon name="refresh" size={20} color="#475569" />
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="close" size={22} color="#475569" />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              setBridgeKey((k) => k + 1);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={PURPLE} size="large" />
            <Text style={styles.loaderText}>
              {isQuoteBuilder ? 'Opening quotation builder…' : 'Opening CRM…'}
            </Text>
            {isQuoteBuilder ? (
              <Text style={styles.loaderHint}>Same builder & PDF as website</Text>
            ) : null}
          </View>
        ) : null}
        <WebView
          key={`crm-bridge-${bridgeKey}`}
          ref={webRef}
          source={{
            html: bridgeHtml,
            baseUrl: `${resolveCrmWebOrigin()}/`,
          }}
          style={styles.web}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('CRM page load failed. Check internet and retry.');
          }}
          onHttpError={() => {
            setLoading(false);
            setError('CRM server error. Retry after some time.');
          }}
          onNavigationStateChange={(nav) => {
            setCanGoBack(nav.canGoBack);
          }}
          injectedJavaScriptBeforeContentLoaded={isQuoteBuilder ? buildDesktopViewportScript() : undefined}
          injectedJavaScript={reinject}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  webWrap: { flex: 1 },
  web: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: { color: '#64748B', fontWeight: '600' },
  loaderHint: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  error: { margin: 24, textAlign: 'center', color: '#64748B' },
  errorBox: { padding: 16, alignItems: 'center' },
  retryBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
