import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { LeadPicker } from '@/src/components/LeadPicker';
import { LoadingView } from '@/src/components/LoadingView';
import { getQuoteBuilderPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { createLeadQuotation } from '@/src/services/quotations';
import { fetchLeadDetail } from '@/src/services/leads';
import type { Lead, UserRole } from '@/src/types';

const PURPLE = '#7C3AED';

export default function CreateQuotationScreen() {
  const { leadId: leadIdParam } = useLocalSearchParams<{ leadId?: string }>();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const queryClient = useQueryClient();

  const [leadId, setLeadId] = useState(leadIdParam || '');
  const [leadName, setLeadName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('5');
  const [adults, setAdults] = useState('2');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [asDraft, setAsDraft] = useState(false);
  const [loadingLead, setLoadingLead] = useState(!!leadIdParam);

  const applyLead = (lead: Lead) => {
    setLeadId(lead._id);
    setLeadName(lead.name || 'Lead');
    setPackageName(lead.destination || '');
    setDestination(lead.destination || '');
    if (lead.budget) setAmount(String(lead.budget));
  };

  useEffect(() => {
    if (!role || !leadIdParam) {
      setLoadingLead(false);
      return;
    }
    fetchLeadDetail(role, leadIdParam)
      .then(applyLead)
      .catch(() => {})
      .finally(() => setLoadingLead(false));
  }, [role, leadIdParam]);

  const mutation = useMutation({
    mutationFn: () =>
      createLeadQuotation(role!, {
        leadId: leadId.trim(),
        packageName: packageName.trim() || destination.trim() || 'Custom Package',
        amount: Number(amount) || 0,
        notes: notes.trim() || undefined,
        asDraft,
        adults: Number(adults) || 2,
        duration: Number(duration) || 0,
        destination: destination.trim() || undefined,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['lead-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      const qid = created?._id;
      Alert.alert('Quotation created', created?.quoteNumber || 'Saved in app', [
        {
          text: 'View PDF',
          onPress: () => (qid ? router.replace(`/quotation/${qid}`) : router.back()),
        },
        { text: 'Done', onPress: () => router.back() },
      ]);
    },
    onError: (error) => Alert.alert('Create failed', getErrorMessage(error)),
  });

  if (!role) return <LoadingView />;
  if (loadingLead) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Create Quotation</Text>
          <Text style={styles.sub}>Native mobile quotation (same CRM APIs)</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Lead *</Text>
        <Pressable
          style={styles.pickerBtn}
          disabled={!!leadIdParam}
          onPress={() => setPickerOpen(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={leadName || leadId ? styles.pickerValue : styles.pickerPlaceholder}>
              {leadName || (leadId ? `Selected · ${leadId.slice(-6)}` : 'Search & select a lead')}
            </Text>
            {leadId ? (
              <Text style={styles.pickerHint} numberOfLines={1}>
                ID · {leadId}
              </Text>
            ) : null}
          </View>
          {!leadIdParam ? <AppIcon name="search" size={18} color={PURPLE} /> : null}
        </Pressable>

        <Text style={styles.label}>Package name *</Text>
        <TextInput
          value={packageName}
          onChangeText={setPackageName}
          placeholder="Shimla Manali 5N/6D"
          style={styles.input}
        />

        <Text style={styles.label}>Destination</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Shimla / Manali"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Duration (days)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Adults</Text>
            <TextInput
              value={adults}
              onChangeText={setAdults}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Total amount (₹) *</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="25000"
          style={styles.input}
        />

        <Text style={styles.label}>Notes / inclusions</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Hotels, cab, meals..."
          style={[styles.input, { minHeight: 90 }]}
          multiline
        />

        <Pressable onPress={() => setAsDraft((v) => !v)} style={styles.checkRow}>
          <AppIcon name={asDraft ? 'checkbox' : 'square-outline'} size={22} color={PURPLE} />
          <Text style={styles.checkText}>Save as draft</Text>
        </Pressable>

        <Pressable
          style={styles.submit}
          disabled={mutation.isPending}
          onPress={() => {
            if (!leadId.trim()) return Alert.alert('Required', 'Select a lead first');
            if (!Number(amount)) return Alert.alert('Required', 'Enter quotation amount');
            mutation.mutate();
          }}
        >
          <AppIcon name="document-text" size={18} color="#fff" />
          <Text style={styles.submitText}>
            {mutation.isPending ? 'Saving…' : asDraft ? 'Save Draft' : 'Create Quotation'}
          </Text>
        </Pressable>

        {leadId ? (
          <Pressable
            style={styles.webBuilder}
            onPress={() =>
              router.push({
                pathname: '/crm-web',
                params: {
                  path: getQuoteBuilderPath(role, leadId),
                  title: 'Full Quote Builder',
                },
              })
            }
          >
            <AppIcon name="globe-outline" size={18} color={PURPLE} />
            <Text style={styles.webBuilderText}>Open full CRM quote builder</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <LeadPicker
        visible={pickerOpen}
        role={role}
        onClose={() => setPickerOpen(false)}
        onSelect={applyLead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
  pickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  pickerPlaceholder: { fontSize: 15, color: '#94A3B8' },
  pickerHint: { marginTop: 2, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  checkText: { fontWeight: '600', color: '#334155' },
  submit: {
    marginTop: 20,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  webBuilder: {
    marginTop: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  webBuilderText: { color: PURPLE, fontWeight: '800', fontSize: 14 },
});
