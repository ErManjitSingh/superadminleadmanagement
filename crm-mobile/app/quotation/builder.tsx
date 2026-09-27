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
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getErrorMessage } from '@/src/lib/apiClient';
import { fetchLeadDetail } from '@/src/services/leads';
import {
  buildQuotationPdfHtml,
  fetchQuotation,
  saveQuotationBuilder,
} from '@/src/services/quotations';
import type { Lead, UserRole } from '@/src/types';

const STEPS = [
  { id: 1, title: 'Package', subtitle: 'Basic details', icon: 'briefcase-outline' as const },
  { id: 2, title: 'Itinerary', subtitle: 'Day-wise plan', icon: 'map-outline' as const },
  { id: 3, title: 'Hotels', subtitle: 'Stay options', icon: 'bed-outline' as const },
  { id: 4, title: 'Transport', subtitle: 'Travel options', icon: 'car-outline' as const },
  { id: 5, title: 'Pricing', subtitle: 'Total cost', icon: 'cash-outline' as const },
  { id: 6, title: 'Preview', subtitle: 'Review & save', icon: 'eye-outline' as const },
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

  const stepIndex = visibleSteps.findIndex((s) => s.id === step);
  const progress = ((stepIndex + 1) / visibleSteps.length) * 100;

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
  const isFirst = step === visibleSteps[0].id;
  const isLast = step === 6;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{quoteId ? 'Edit Quotation' : 'New Quotation'}</Text>
          <Text style={styles.sub}>
            {stepMeta.title} · {stepIndex + 1} of {visibleSteps.length}
          </Text>
        </View>
        <View style={styles.stepBadge}>
          <Ionicons name={stepMeta.icon} size={16} color={colors.primary} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepRow}
      >
        {visibleSteps.map((s, i) => {
          const active = s.id === step;
          const done = stepIndex > i;
          return (
            <Pressable key={s.id} onPress={() => setStep(s.id)} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  done && styles.stepCircleDone,
                  active && styles.stepCircleActive,
                ]}
              >
                {done && !active ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      (active || done) && styles.stepNumActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={[styles.card, shadows.card]}>
            <SectionHeader icon="briefcase" title="Package details" hint="Lead, destination & pax" />

            <Text style={styles.label}>Lead *</Text>
            <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
              <View style={styles.pickerLeft}>
                <View style={styles.pickerIcon}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                </View>
                <Text style={{ color: leadName ? colors.text : colors.textMuted, fontWeight: '700', flex: 1 }}>
                  {leadName || 'Search & select lead'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>

            <Text style={styles.label}>Package name *</Text>
            <TextInput
              value={packageName}
              onChangeText={setPackageName}
              placeholder="Shimla Manali 5N/6D"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Destination</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Shimla / Manali"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <DateTimeField label="Travel date" mode="date" value={travelDate} onChange={setTravelDate} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Days</Text>
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
          <View style={[styles.card, shadows.card]}>
            <SectionHeader
              icon="map"
              title="Day-wise itinerary"
              hint={`${days.length} day${days.length === 1 ? '' : 's'}`}
              actionLabel="+ Add day"
              onAction={() =>
                setDays((d) => [
                  ...d,
                  { day: d.length + 1, title: `Day ${d.length + 1}`, description: '' },
                ])
              }
            />
            {days.map((d, idx) => (
              <View key={`day-${idx}`} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>D{idx + 1}</Text>
                  </View>
                  <Text style={styles.itemTitle}>Day {idx + 1}</Text>
                  {days.length > 1 ? (
                    <Pressable
                      onPress={() => setDays((arr) => arr.filter((_, i) => i !== idx).map((x, i) => ({ ...x, day: i + 1 })))}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  value={d.title}
                  onChangeText={(t) =>
                    setDays((arr) => arr.map((x, i) => (i === idx ? { ...x, title: t } : x)))
                  }
                  placeholder="Title (e.g. Arrival & local sightseeing)"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <TextInput
                  value={d.description}
                  onChangeText={(t) =>
                    setDays((arr) => arr.map((x, i) => (i === idx ? { ...x, description: t } : x)))
                  }
                  placeholder="Activities / description"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.multiline]}
                  multiline
                />
              </View>
            ))}
          </View>
        )}

        {step === 3 && !noHotel && (
          <View style={[styles.card, shadows.card]}>
            <SectionHeader
              icon="bed"
              title="Hotels"
              hint={hotelCategory}
              actionLabel="+ Add hotel"
              onAction={() =>
                setHotels((h) => [...h, { name: '', nights: '1', roomType: 'Double' }])
              }
            />
            {hotels.map((h, idx) => (
              <View key={`hotel-${idx}`} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={[styles.dayBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="bed" size={14} color={colors.info} />
                  </View>
                  <Text style={styles.itemTitle}>Hotel {idx + 1}</Text>
                  {hotels.length > 1 ? (
                    <Pressable
                      onPress={() => setHotels((arr) => arr.filter((_, i) => i !== idx))}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  value={h.name}
                  onChangeText={(t) =>
                    setHotels((arr) => arr.map((x, i) => (i === idx ? { ...x, name: t } : x)))
                  }
                  placeholder="Hotel name"
                  placeholderTextColor={colors.textMuted}
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
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={[styles.card, shadows.card]}>
            <SectionHeader
              icon="car"
              title="Transport"
              hint={`${cabs.length} vehicle${cabs.length === 1 ? '' : 's'}`}
              actionLabel="+ Add vehicle"
              onAction={() =>
                setCabs((c) => [...c, { vehicleName: 'SUV', cost: '0', vehicleCount: '1' }])
              }
            />
            {cabs.map((c, idx) => (
              <View key={`cab-${idx}`} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={[styles.dayBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="car" size={14} color={colors.warning} />
                  </View>
                  <Text style={styles.itemTitle}>Vehicle {idx + 1}</Text>
                  {cabs.length > 1 ? (
                    <Pressable
                      onPress={() => setCabs((arr) => arr.filter((_, i) => i !== idx))}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.label}>Vehicle type</Text>
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
          <View style={[styles.card, shadows.card]}>
            <SectionHeader icon="cash" title="Pricing" hint="Grand total & notes" />
            <Text style={styles.label}>Grand total (₹) *</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="25,000"
                placeholderTextColor={colors.textMuted}
                style={styles.amountInput}
              />
            </View>
            <View style={styles.hintBox}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.hintBoxText}>
                Payment plan auto-splits 30% advance · 50% before tour · 20% on arrival.
              </Text>
            </View>
            <Text style={styles.label}>Internal notes / guidelines</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Inclusions notes, guidelines…"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.multiline, { minHeight: 100 }]}
              multiline
            />
          </View>
        )}

        {step === 6 && (
          <View style={[styles.card, shadows.card]}>
            <SectionHeader icon="eye" title="Review & save" hint="Check before submitting" />

            <View style={styles.summaryHero}>
              <Text style={styles.summaryPkg} numberOfLines={2}>
                {packageName || destination || 'Custom Package'}
              </Text>
              <Text style={styles.summaryTotal}>
                {Number(amount) ? `₹${Number(amount).toLocaleString('en-IN')}` : '—'}
              </Text>
              <Text style={styles.summaryLead}>{leadName || 'No lead selected'}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryTile icon="calendar" label="Duration" value={`${duration} days`} />
              <SummaryTile icon="people" label="Pax" value={`${adults}A · ${children}C`} />
              <SummaryTile icon="restaurant" label="Meal" value={mealPlan} />
              <SummaryTile icon="map" label="Days" value={String(days.length)} />
              {!noHotel ? (
                <SummaryTile
                  icon="bed"
                  label="Hotels"
                  value={String(hotels.filter((h) => h.name).length)}
                />
              ) : null}
              <SummaryTile icon="car" label="Vehicles" value={String(cabs.length)} />
            </View>

            {savedHtml ? (
              <View style={styles.pdfBox}>
                <View style={styles.pdfHeader}>
                  <Ionicons name="document-text" size={16} color={colors.primary} />
                  <Text style={styles.pdfLabel}>PDF preview</Text>
                </View>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: savedHtml }}
                  style={styles.pdfWeb}
                  scalesPageToFit
                />
              </View>
            ) : (
              <View style={styles.hintBox}>
                <Ionicons name="document-outline" size={16} color={colors.textMuted} />
                <Text style={styles.hintBoxText}>
                  Save draft or submit to generate PDF preview here.
                </Text>
              </View>
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
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
              <Text style={styles.secondaryText}>Open exact website builder / PDF</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={isFirst}
        >
          <Ionicons name="arrow-back" size={16} color={isFirst ? colors.textMuted : colors.textSecondary} />
          <Text style={[styles.navBtnText, isFirst && { color: colors.textMuted }]}>Back</Text>
        </Pressable>
        {!isLast ? (
          <Pressable style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[styles.navBtn, { flex: 1 }]}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate(true)}
            >
              <Ionicons name="save-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.navBtnText}>
                {saveMutation.isPending ? 'Saving…' : 'Draft'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, { flex: 1.3 }]}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate(false)}
            >
              <Text style={styles.primaryText}>
                {saveMutation.isPending ? 'Saving…' : 'Submit'}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
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

function SectionHeader({
  icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
        </View>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.addLink}>
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryTile}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.summaryTileLabel}>{label}</Text>
      <Text style={styles.summaryTileValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { marginTop: 1, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#EDE9FE',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepItem: { alignItems: 'center', width: 56 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  stepNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  stepNumActive: { color: '#fff' },
  stepLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: { color: colors.primary },
  content: { padding: spacing.lg, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionHint: { marginTop: 1, fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  addLink: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  label: {
    marginTop: spacing.md,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top', marginTop: 8 },
  picker: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pickerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  itemTitle: { flex: 1, fontWeight: '800', color: colors.text, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 14,
  },
  currency: { fontSize: 22, fontWeight: '800', color: colors.primary, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 14,
  },
  hintBox: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  hintBoxText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  summaryHero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryPkg: { fontSize: 18, fontWeight: '800', color: '#fff' },
  summaryTotal: { marginTop: 8, fontSize: 28, fontWeight: '800', color: '#fff' },
  summaryLead: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  summaryTile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  summaryTileLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  summaryTileValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  pdfBox: {
    marginTop: 4,
    height: 300,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#fff',
  },
  pdfLabel: { fontWeight: '700', color: colors.textSecondary, fontSize: 13 },
  pdfWeb: { flex: 1 },
  secondaryBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  secondaryText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
  },
  navBtnDisabled: { opacity: 0.55 },
  navBtnText: { fontWeight: '800', color: colors.textSecondary },
  primaryBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  primaryText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});
