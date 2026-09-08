import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { AppIcon } from '@/src/components/AppIcon';
import { DateTimeField } from '@/src/components/DateTimeField';
import { LeadPicker } from '@/src/components/LeadPicker';
import { LoadingView } from '@/src/components/LoadingView';
import { getQuoteEditorPath } from '@/src/constants/crmMenu';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { fetchLeadDetail } from '@/src/services/leads';
import {
  buildQuotationPdfHtml,
  fetchQuotation,
  saveQuotationBuilder,
} from '@/src/services/quotations';
import type { Lead, UserRole } from '@/src/types';

const PURPLE = '#7C3AED';
const BG = '#F7F8FC';

const STEPS = [
  { id: 1, title: 'Package', subtitle: 'Basic details' },
  { id: 2, title: 'Itinerary', subtitle: 'Day-wise plan' },
  { id: 3, title: 'Hotels', subtitle: 'Stay options' },
  { id: 4, title: 'Transport', subtitle: 'Travel options' },
  { id: 5, title: 'Pricing', subtitle: 'Total cost' },
  { id: 6, title: 'Preview', subtitle: 'Review & save' },
];

const MEAL_PLANS = ['CP', 'MAP', 'AP', 'EP', 'No Hotel (Cab Only)'];
const HOTEL_CATEGORIES = ['Budget', '3 Star', '4 Star', '5 Star', 'Luxury', 'Boutique'];
const VEHICLES = [
  'Sedan (Dzire/Etios)',
  'SUV',
  'Innova Crysta',
  'Tempo Traveller (12 Seater)',
  'Tempo Traveller (17 Seater)',
  'Urbania',
  'Bus (55 Seater)',
];

type DayItem = { day: number; title: string; description: string };
type HotelItem = { name: string; nights: string; roomType: string };
type CabItem = { vehicleName: string; cost: string; vehicleCount: string };

export default function NativeQuotationBuilderScreen() {
  const { leadId: leadIdParam, quoteId: quoteIdParam } = useLocalSearchParams<{
    leadId?: string;
    quoteId?: string;
  }>();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leadId, setLeadId] = useState(leadIdParam || '');
  const [leadName, setLeadName] = useState('');
  const [quoteId, setQuoteId] = useState(quoteIdParam || '');
  const [packageName, setPackageName] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('5');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [mealPlan, setMealPlan] = useState('MAP');
  const [hotelCategory, setHotelCategory] = useState('3 Star');
  const [travelDate, setTravelDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState<DayItem[]>([
    { day: 1, title: 'Arrival & sightseeing', description: '' },
  ]);
  const [hotels, setHotels] = useState<HotelItem[]>([{ name: '', nights: '2', roomType: 'Double' }]);
  const [cabs, setCabs] = useState<CabItem[]>([
    { vehicleName: 'Sedan (Dzire/Etios)', cost: '0', vehicleCount: '1' },
  ]);
  const [savedHtml, setSavedHtml] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(!!quoteIdParam);

  const noHotel = /no hotel/i.test(mealPlan);
  const visibleSteps = useMemo(
    () => STEPS.filter((s) => !(noHotel && s.id === 3)),
    [noHotel]
  );

  const leadQuery = useQuery({
    queryKey: ['lead', role, leadId],
    queryFn: () => fetchLeadDetail(role!, leadId),
    enabled: !!role && !!leadId && !leadName,
  });

  useEffect(() => {
    const lead = leadQuery.data;
    if (!lead) return;
    applyLead(lead, false);
  }, [leadQuery.data]);

  useEffect(() => {
    if (!role || !quoteIdParam) {
      setLoadingExisting(false);
      return;
    }
    fetchQuotation(role, quoteIdParam)
      .then((q) => {
        setQuoteId(q._id);
        const lid =
          typeof q.lead === 'object' ? q.lead?._id : typeof q.lead === 'string' ? q.lead : '';
        if (lid) setLeadId(lid);
        if (typeof q.lead === 'object' && q.lead?.name) setLeadName(q.lead.name);
        setPackageName(q.packageInfo?.packageName || q.packageSnapshot?.name || '');
        setDestination(q.packageInfo?.destination || q.packageSnapshot?.destination || '');
        setDuration(String(q.packageInfo?.duration || 5));
        setAdults(String(q.packageInfo?.adults || 2));
        setChildren(String(q.packageInfo?.children || 0));
        setMealPlan(q.packageInfo?.mealPlan || 'MAP');
        setHotelCategory(q.packageInfo?.hotelCategory || '3 Star');
        const total =
          Number(q.pricing?.total) || Number(q.pricing?.grandTotal) || Number(q.costing?.grandTotal) || 0;
        if (total) setAmount(String(total));
        setNotes(q.importantNotes?.travelGuidelines || q.customizations || '');
        const itin = (q.packageSnapshot as { itinerary?: DayItem[] } | undefined)?.itinerary;
        if (Array.isArray(itin) && itin.length) {
          setDays(
            itin.map((d, i) => ({
              day: Number(d.day || i + 1),
              title: String(d.title || `Day ${i + 1}`),
              description: String(d.description || ''),
            }))
          );
        }
        setSavedHtml(buildQuotationPdfHtml(q));
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [role, quoteIdParam]);

  const applyLead = (lead: Lead, overwrite = true) => {
    setLeadId(lead._id);
    setLeadName(lead.name || 'Lead');
    if (overwrite || !destination) setDestination(lead.destination || '');
    if (overwrite || !packageName) setPackageName(lead.destination || '');
    if ((overwrite || !amount) && lead.budget) setAmount(String(lead.budget));
  };

  const syncDurationDays = (n: number) => {
    const count = Math.max(1, Math.min(21, n));
    setDuration(String(count));
    setDays((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ day: next.length + 1, title: `Day ${next.length + 1}`, description: '' });
      }
      return next.slice(0, count).map((d, i) => ({ ...d, day: i + 1 }));
    });
  };

  const saveMutation = useMutation({
    mutationFn: (asDraft: boolean) =>
      saveQuotationBuilder(role!, {
        leadId,
        quoteId: quoteId || undefined,
        asDraft,
        packageName: packageName.trim() || destination.trim() || 'Custom Package',
        destination: destination.trim() || packageName.trim(),
        duration: Number(duration) || days.length || 1,
        adults: Number(adults) || 2,
        children: Number(children) || 0,
        mealPlan,
        hotelCategory: noHotel ? 'No Hotel' : hotelCategory,
        travelDate: travelDate.toISOString().slice(0, 10),
        amount: Number(amount) || 0,
        notes: notes.trim() || undefined,
        itinerary: days,
        hotels: noHotel
          ? []
          : hotels.map((h) => ({
              name: h.name,
              nights: Number(h.nights) || 1,
              roomType: h.roomType,
              mealPlan,
            })),
        cabs: cabs.map((c) => ({
          vehicleName: c.vehicleName,
          vehicleType: c.vehicleName,
          cost: Number(c.cost) || 0,
          vehicleCount: Number(c.vehicleCount) || 1,
        })),
      }),
    onSuccess: (saved, asDraft) => {
      if (saved?._id) setQuoteId(saved._id);
      setSavedHtml(buildQuotationPdfHtml(saved));
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['lead-quotations'] });
      Alert.alert(
        asDraft ? 'Draft saved' : 'Quotation saved',
        saved?.quoteNumber || 'Saved successfully',
        [
          {
            text: 'Exact website PDF',
            onPress: () =>
              router.push({
                pathname: '/crm-web',
                params: {
                  path: getQuoteEditorPath(role, {
                    leadId,
                    quoteId: saved._id,
                  }),
                  title: 'Website PDF Builder',
                },
              }),
          },
          { text: 'OK' },
        ]
      );
    },
    onError: (error) => Alert.alert('Save failed', getErrorMessage(error)),
  });

  const goNext = () => {
    if (step === 1 && !leadId) {
      Alert.alert('Lead required', 'Select a lead first');
      return;
    }
    if (step === 5 && !Number(amount)) {
      Alert.alert('Amount required', 'Enter package total');
      return;
    }
    const idx = visibleSteps.findIndex((s) => s.id === step);
    const next = visibleSteps[Math.min(visibleSteps.length - 1, idx + 1)];
    setStep(next.id);
  };

  const goPrev = () => {
    const idx = visibleSteps.findIndex((s) => s.id === step);
    const prev = visibleSteps[Math.max(0, idx - 1)];
    setStep(prev.id);
  };

  if (!role) return <LoadingView />;
  if (loadingExisting) return <LoadingView />;

  const stepMeta = STEPS.find((s) => s.id === step)!;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quotation Builder</Text>
          <Text style={styles.sub}>
            Step {visibleSteps.findIndex((s) => s.id === step) + 1}/{visibleSteps.length} ·{' '}
            {stepMeta.title}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepRow}
      >
        {visibleSteps.map((s, i) => {
          const active = s.id === step;
          const done = visibleSteps.findIndex((x) => x.id === step) > i;
          return (
            <Pressable
              key={s.id}
              onPress={() => setStep(s.id)}
              style={[styles.stepChip, active && styles.stepChipActive, done && styles.stepChipDone]}
            >
              <Text style={[styles.stepChipText, (active || done) && { color: '#fff' }]}>
                {i + 1}. {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Package details</Text>
            <Text style={styles.label}>Lead *</Text>
            <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
              <Text style={{ color: leadName ? '#0F172A' : '#94A3B8', fontWeight: '700' }}>
                {leadName || 'Search & select lead'}
              </Text>
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

            <DateTimeField label="Travel date" mode="date" value={travelDate} onChange={setTravelDate} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Duration (days)</Text>
                <TextInput
                  value={duration}
                  onChangeText={(t) => syncDurationDays(Number(t) || 1)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Adults</Text>
                <TextInput value={adults} onChangeText={setAdults} keyboardType="numeric" style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Children</Text>
                <TextInput
                  value={children}
                  onChangeText={setChildren}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Meal plan</Text>
            <ChipRow options={MEAL_PLANS} value={mealPlan} onChange={setMealPlan} />
            {!noHotel ? (
              <>
                <Text style={styles.label}>Hotel category</Text>
                <ChipRow options={HOTEL_CATEGORIES} value={hotelCategory} onChange={setHotelCategory} />
              </>
            ) : null}
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Day-wise itinerary</Text>
              <Pressable
                onPress={() =>
                  setDays((d) => [
                    ...d,
                    { day: d.length + 1, title: `Day ${d.length + 1}`, description: '' },
                  ])
                }
              >
                <Text style={styles.link}>+ Add day</Text>
              </Pressable>
            </View>
            {days.map((d, idx) => (
              <View key={`day-${idx}`} style={styles.dayCard}>
                <Text style={styles.dayLabel}>Day {idx + 1}</Text>
                <TextInput
                  value={d.title}
                  onChangeText={(t) =>
                    setDays((arr) => arr.map((x, i) => (i === idx ? { ...x, title: t } : x)))
                  }
                  placeholder="Title"
                  style={styles.input}
                />
                <TextInput
                  value={d.description}
                  onChangeText={(t) =>
                    setDays((arr) => arr.map((x, i) => (i === idx ? { ...x, description: t } : x)))
                  }
                  placeholder="Activities / description"
                  style={[styles.input, { minHeight: 70, marginTop: 8 }]}
                  multiline
                />
              </View>
            ))}
          </View>
        )}

        {step === 3 && !noHotel && (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Hotels</Text>
              <Pressable
                onPress={() =>
                  setHotels((h) => [...h, { name: '', nights: '1', roomType: 'Double' }])
                }
              >
                <Text style={styles.link}>+ Add hotel</Text>
              </Pressable>
            </View>
            {hotels.map((h, idx) => (
              <View key={`hotel-${idx}`} style={styles.dayCard}>
                <TextInput
                  value={h.name}
                  onChangeText={(t) =>
                    setHotels((arr) => arr.map((x, i) => (i === idx ? { ...x, name: t } : x)))
                  }
                  placeholder="Hotel name"
                  style={styles.input}
                />
                <View style={[styles.row, { marginTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Nights</Text>
                    <TextInput
                      value={h.nights}
                      onChangeText={(t) =>
                        setHotels((arr) => arr.map((x, i) => (i === idx ? { ...x, nights: t } : x)))
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Room</Text>
                    <TextInput
                      value={h.roomType}
                      onChangeText={(t) =>
                        setHotels((arr) =>
                          arr.map((x, i) => (i === idx ? { ...x, roomType: t } : x))
                        )
                      }
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Transport</Text>
              <Pressable
                onPress={() =>
                  setCabs((c) => [
                    ...c,
                    { vehicleName: 'SUV', cost: '0', vehicleCount: '1' },
                  ])
                }
              >
                <Text style={styles.link}>+ Add vehicle</Text>
              </Pressable>
            </View>
            {cabs.map((c, idx) => (
              <View key={`cab-${idx}`} style={styles.dayCard}>
                <Text style={styles.label}>Vehicle</Text>
                <ChipRow
                  options={VEHICLES}
                  value={c.vehicleName}
                  onChange={(v) =>
                    setCabs((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, vehicleName: v } : x))
                    )
                  }
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Count</Text>
                    <TextInput
                      value={c.vehicleCount}
                      onChangeText={(t) =>
                        setCabs((arr) =>
                          arr.map((x, i) => (i === idx ? { ...x, vehicleCount: t } : x))
                        )
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Cost (₹)</Text>
                    <TextInput
                      value={c.cost}
                      onChangeText={(t) =>
                        setCabs((arr) => arr.map((x, i) => (i === idx ? { ...x, cost: t } : x)))
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 5 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <Text style={styles.label}>Grand total (₹) *</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="25000"
              style={styles.input}
            />
            <Text style={styles.hint}>
              Payment plan auto-splits 30% advance · 50% before tour · 20% on arrival (same as
              website).
            </Text>
            <Text style={styles.label}>Internal notes / guidelines</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Inclusions notes, guidelines…"
              style={[styles.input, { minHeight: 90 }]}
              multiline
            />
          </View>
        )}

        {step === 6 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Review & save</Text>
            <InfoRow label="Lead" value={leadName || '—'} />
            <InfoRow label="Package" value={packageName || destination || '—'} />
            <InfoRow label="Duration" value={`${duration} days`} />
            <InfoRow label="Pax" value={`${adults} adults · ${children} kids`} />
            <InfoRow label="Meal" value={mealPlan} />
            <InfoRow
              label="Total"
              value={Number(amount) ? `₹${Number(amount).toLocaleString('en-IN')}` : '—'}
            />
            <InfoRow label="Itinerary days" value={String(days.length)} />
            {!noHotel ? <InfoRow label="Hotels" value={String(hotels.filter((h) => h.name).length)} /> : null}
            <InfoRow label="Vehicles" value={String(cabs.length)} />

            {savedHtml ? (
              <View style={styles.pdfBox}>
                <Text style={styles.pdfLabel}>PDF preview</Text>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: savedHtml }}
                  style={styles.pdfWeb}
                  scalesPageToFit
                />
              </View>
            ) : (
              <Text style={styles.hint}>Save draft / submit to generate PDF preview.</Text>
            )}

            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                router.push({
                  pathname: '/crm-web',
                  params: {
                    path: getQuoteEditorPath(role, {
                      leadId: leadId || undefined,
                      quoteId: quoteId || undefined,
                    }),
                    title: 'Website Quotation (exact PDF)',
                  },
                })
              }
            >
              <Ionicons name="globe-outline" size={16} color={PURPLE} />
              <Text style={styles.secondaryText}>Open exact website builder / PDF</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.navBtn} onPress={goPrev} disabled={step === visibleSteps[0].id}>
          <Text style={styles.navBtnText}>Back</Text>
        </Pressable>
        {step < 6 ? (
          <Pressable style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[styles.navBtn, { flex: 1 }]}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate(true)}
            >
              <Text style={styles.navBtnText}>
                {saveMutation.isPending ? 'Saving…' : 'Save draft'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, { flex: 1.2 }]}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate(false)}
            >
              <Text style={styles.primaryText}>
                {saveMutation.isPending ? 'Saving…' : 'Submit'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {role ? (
        <LeadPicker
          visible={pickerOpen}
          role={role}
          onClose={() => setPickerOpen(false)}
          onSelect={(lead) => applyLead(lead, true)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
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
  stepRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  stepChipDone: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  stepChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  label: { marginTop: 10, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
  },
  picker: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  row: { flexDirection: 'row', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  chipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#fff' },
  dayCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  dayLabel: { fontWeight: '800', color: PURPLE, marginBottom: 6 },
  link: { color: PURPLE, fontWeight: '800', fontSize: 13 },
  hint: { marginTop: 8, color: '#94A3B8', fontSize: 12, lineHeight: 17 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { color: '#94A3B8', fontWeight: '600' },
  infoValue: { color: '#0F172A', fontWeight: '800', maxWidth: '60%', textAlign: 'right' },
  pdfBox: { marginTop: 14, height: 320, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  pdfLabel: { padding: 8, fontWeight: '700', color: '#475569', backgroundColor: '#fff' },
  pdfWeb: { flex: 1 },
  secondaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryText: { color: PURPLE, fontWeight: '800', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  navBtnText: { fontWeight: '800', color: '#475569' },
  primaryBtn: {
    flex: 1.4,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PURPLE,
  },
  primaryText: { fontWeight: '800', color: '#fff' },
});
