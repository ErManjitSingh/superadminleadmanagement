import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { getQuoteEditorPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { fetchQuotation } from '@/src/services/quotations';
import type { UserRole } from '@/src/types';

const PURPLE = '#7C3AED';

/** Opens website quotation builder/PDF for this quote — identical to CRM web. */
export default function QuotationPdfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  const query = useQuery({
    queryKey: ['quotation', role, id],
    queryFn: () => fetchQuotation(role!, id!),
    enabled: !!role && !!id,
    retry: 1,
  });

  useEffect(() => {
    if (!role || !id || query.isLoading) return;
    if (query.isError) return;

    const quote = query.data;
    const leadId =
      typeof quote?.lead === 'object'
        ? quote?.lead?._id
        : typeof quote?.lead === 'string'
          ? quote.lead
          : undefined;

    const path = getQuoteEditorPath(role, {
      leadId: leadId || undefined,
      quoteId: String(id),
    });

    router.replace({
      pathname: '/crm-web',
      params: { path, title: quote?.quoteNumber || 'Quotation Builder' },
    });
  }, [role, id, query.isLoading, query.isError, query.data]);

  if (!role) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.error}>Please login again</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <AppIcon name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Quotation</Text>
        </View>
        <View style={styles.center}>
          <AppIcon name="document-text-outline" size={40} color="#94A3B8" />
          <Text style={styles.errorTitle}>Could not open quotation</Text>
          <Text style={styles.errorSub}>{getErrorMessage(query.error)}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              const path = getQuoteEditorPath(role, { quoteId: String(id) });
              router.replace({
                pathname: '/crm-web',
                params: { path, title: 'Quotation Builder' },
              });
            }}
          >
            <Text style={styles.retryText}>Open builder anyway</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        <ActivityIndicator color={PURPLE} size="large" />
        <Text style={styles.loadingText}>Opening website quotation…</Text>
        <Text style={styles.hint}>Same builder & PDF as CRM web</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingText: { color: '#334155', fontWeight: '700' },
  hint: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  error: { color: '#64748B', textAlign: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  errorSub: { textAlign: 'center', color: '#64748B', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
