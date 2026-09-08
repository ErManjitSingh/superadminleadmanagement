import { useEffect } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getQuoteEditorPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import type { UserRole } from '@/src/types';

/** Opens the exact website quotation builder (same PDF design) in authenticated WebView. */
export default function CreateQuotationScreen() {
  const { leadId } = useLocalSearchParams<{ leadId?: string }>();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  useEffect(() => {
    if (!role) return;
    const path = getQuoteEditorPath(role, { leadId: leadId || undefined });
    router.replace({
      pathname: '/crm-web',
      params: { path, title: 'Quotation Builder' },
    });
  }, [role, leadId]);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={styles.text}>Opening website quotation builder…</Text>
        <Text style={styles.sub}>Same design & PDF as CRM web</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  text: { fontWeight: '700', color: '#334155' },
  sub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
});
