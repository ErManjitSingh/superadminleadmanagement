import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { LoadingView } from '@/src/components/LoadingView';
import { getLeadWebPath, getQuoteBuilderPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import {
  buildQuotationPdfHtml,
  fetchQuotation,
  getQuotationPackageName,
  getQuotationTotal,
  type Quotation,
} from '@/src/services/quotations';
import type { UserRole } from '@/src/types';

const PURPLE = '#7C3AED';

function itineraryDays(q: Quotation): Array<{ title?: string; description?: string; day?: number }> {
  const snap = q.packageSnapshot as { itinerary?: Array<Record<string, unknown>> } | undefined;
  const list = snap?.itinerary;
  if (!Array.isArray(list)) return [];
  return list.map((d, i) => ({
    day: Number(d.day || i + 1),
    title: String(d.title || d.name || `Day ${i + 1}`),
    description: String(d.description || d.activities || ''),
  }));
}

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

  const quote = query.data;
  const html = useMemo(() => (quote ? buildQuotationPdfHtml(quote) : ''), [quote]);
  const days = useMemo(() => (quote ? itineraryDays(quote) : []), [quote]);

  if (!role) return <LoadingView />;

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color={PURPLE} size="large" />
          <Text style={styles.loadingText}>Loading quotation…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !quote) {
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
          <Text style={styles.errorTitle}>PDF load nahi hua</Text>
          <Text style={styles.errorSub}>{getErrorMessage(query.error) || 'Quotation not found'}</Text>
          <Pressable onPress={() => query.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const total = getQuotationTotal(quote);
  const pkg = getQuotationPackageName(quote);
  const leadName =
    typeof quote.lead === 'object' && quote.lead?.name ? quote.lead.name : 'Customer';
  const leadPhone =
    typeof quote.lead === 'object' && quote.lead?.phone ? quote.lead.phone : '';
  const leadId =
    typeof quote.lead === 'object'
      ? quote.lead?._id
      : typeof quote.lead === 'string'
        ? quote.lead
        : undefined;
  const status = (quote.status || 'draft').replace(/_/g, ' ');

  const openCrmPdf = () => {
    if (leadId) {
      router.push({
        pathname: '/crm-web',
        params: {
          path: `${getLeadWebPath(role, leadId)}#activity-timeline`,
          title: 'CRM PDF',
        },
      });
      return;
    }
    const base = getQuoteBuilderPath(role, leadId);
    const path = `${base}${base.includes('?') ? '&' : '?'}quoteId=${encodeURIComponent(String(id))}`;
    router.push({ pathname: '/crm-web', params: { path, title: 'CRM Quotation' } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{quote.quoteNumber || 'Quotation'}</Text>
          <Text style={styles.sub}>PDF / Brochure preview</Text>
        </View>
        <Pressable onPress={openCrmPdf} style={styles.crmBtn}>
          <AppIcon name="globe-outline" size={16} color="#fff" />
          <Text style={styles.crmBtnText}>CRM PDF</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.paper}>
          <Text style={styles.brand}>Explore My Bharat</Text>
          <Text style={styles.quoteMeta}>
            {quote.quoteNumber || 'Draft'} · {status}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Guest</Text>
              <Text style={styles.infoValue}>{leadName}</Text>
              {leadPhone ? <Text style={styles.infoMuted}>{leadPhone}</Text> : null}
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Package</Text>
              <Text style={styles.infoValue}>{pkg}</Text>
              <Text style={styles.infoMuted}>
                {quote.packageInfo?.destination || quote.packageSnapshot?.destination || '—'}
              </Text>
            </View>
          </View>

          {(quote.packageInfo?.adults || quote.packageInfo?.duration) && (
            <View style={styles.paxRow}>
              <Text style={styles.paxText}>
                Adults: {quote.packageInfo?.adults ?? 2}
                {quote.packageInfo?.children ? ` · Kids: ${quote.packageInfo.children}` : ''}
                {quote.packageInfo?.duration
                  ? ` · ${quote.packageInfo.duration} Days`
                  : ''}
              </Text>
            </View>
          )}

          {days.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Itinerary</Text>
              {days.map((d) => (
                <View key={`${d.day}-${d.title}`} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>
                    Day {d.day}: {d.title}
                  </Text>
                  {d.description ? <Text style={styles.dayDesc}>{d.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {(quote.paymentPlan || []).length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment plan</Text>
              {(quote.paymentPlan || []).map((p, i) => (
                <View key={`${p.label}-${i}`} style={styles.planRow}>
                  <Text style={styles.planLabel}>{p.label || 'Payment'}</Text>
                  <Text style={styles.planPct}>{p.percent || 0}%</Text>
                  <Text style={styles.planAmt}>
                    ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {quote.importantNotes?.travelGuidelines || quote.customizations ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesBody}>
                {quote.importantNotes?.travelGuidelines || quote.customizations}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.webLabel}>Brochure page</Text>
        <View style={styles.webCard}>
          <WebView
            originWhitelist={['*']}
            source={{
              html,
              baseUrl: 'https://crm.exploremybharat.info/',
            }}
            style={styles.web}
            scrollEnabled
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            scalesPageToFit
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingText: { color: '#64748B', fontWeight: '600' },
  errorTitle: { marginTop: 8, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  errorSub: { textAlign: 'center', color: '#64748B', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  crmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  crmBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { padding: 16, paddingBottom: 40 },
  paper: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  brand: { fontSize: 22, fontWeight: '900', color: PURPLE },
  quoteMeta: { marginTop: 4, color: '#64748B', fontWeight: '600', textTransform: 'capitalize' },
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  infoCard: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  infoMuted: { marginTop: 2, fontSize: 12, color: '#64748B' },
  paxRow: { marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  paxText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  dayCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dayTitle: { fontWeight: '800', color: '#0F172A', fontSize: 14 },
  dayDesc: { marginTop: 4, color: '#64748B', fontSize: 13, lineHeight: 18 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  planLabel: { flex: 1, fontWeight: '600', color: '#334155' },
  planPct: { width: 48, color: '#64748B', fontWeight: '700' },
  planAmt: { fontWeight: '800', color: PURPLE },
  notesBox: {
    marginTop: 14,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
  },
  notesTitle: { fontWeight: '800', color: '#9A3412', marginBottom: 4 },
  notesBody: { color: '#9A3412', lineHeight: 18 },
  totalBar: {
    marginTop: 16,
    backgroundColor: PURPLE,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: '#EDE9FE', fontWeight: '700' },
  totalValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  webLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  webCard: {
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  web: { flex: 1, backgroundColor: '#fff' },
});
