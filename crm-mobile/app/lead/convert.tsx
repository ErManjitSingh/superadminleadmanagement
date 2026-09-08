import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { DateTimeField } from '@/src/components/DateTimeField';
import { LoadingView } from '@/src/components/LoadingView';
import { getErrorMessage } from '@/src/lib/apiClient';
import { promptPickImage, type PickedImage } from '@/src/lib/pickImage';
import {
  PAYMENT_MODES,
  buildAdvanceVoucherHtml,
  convertLeadWithPayment,
  fetchConvertPreview,
  fetchReceiptPdfBase64,
  type ConvertResult,
} from '@/src/services/payments';

const PURPLE = '#7C3AED';

export default function ConvertLeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [mode, setMode] = useState('upi');
  const [remarks, setRemarks] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [aadhaarPhoto, setAadhaarPhoto] = useState<PickedImage | null>(null);
  const [screenshot, setScreenshot] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [voucherHtml, setVoucherHtml] = useState('');
  const [pdfHtml, setPdfHtml] = useState('');

  const previewQuery = useQuery({
    queryKey: ['convert-preview', id],
    queryFn: () => fetchConvertPreview(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const cost = previewQuery.data?.totalPackageCost;
    if (cost && cost > 0 && !amount) {
      setAmount(String(Math.round(cost * 0.3)));
    }
  }, [previewQuery.data, amount]);

  const paymentDateStr = paymentDate.toISOString().slice(0, 10);

  const convertMutation = useMutation({
    mutationFn: () =>
      convertLeadWithPayment(id!, {
        amount: Number(amount),
        paymentDate: paymentDateStr,
        mode,
        remarks: remarks.trim() || undefined,
        aadhaarNumber: aadhaar.replace(/\D/g, ''),
        aadhaarPhotoBase64: aadhaarPhoto?.base64DataUri,
        screenshotBase64: screenshot?.base64DataUri,
        sendReceipt: false,
      }),
    onSuccess: async (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const preview = previewQuery.data;
      const html = buildAdvanceVoucherHtml({
        customerName: preview?.customerName || 'Guest',
        phone: preview?.customerPhone || preview?.phone,
        packageName: preview?.packageName,
        destination: preview?.destination,
        bookingNumber: data.booking?.bookingNumber,
        amount: Number(amount),
        totalPackageCost: preview?.totalPackageCost,
        mode,
        paymentDate: paymentDateStr,
        quotationNumber: preview?.quotationNumber || data.quotation?.quoteNumber,
      });
      setVoucherHtml(html);

      try {
        if (data.booking?._id && data.payment?._id) {
          const b64 = await fetchReceiptPdfBase64(data.booking._id, data.payment._id);
          setPdfHtml(
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
            <body style="margin:0;background:#334155">
              <embed src="data:application/pdf;base64,${b64}" type="application/pdf" width="100%" height="100%" style="min-height:100vh"/>
            </body></html>`
          );
        }
      } catch {
        /* voucher html still available */
      }
    },
    onError: (error) => Alert.alert('Conversion failed', getErrorMessage(error)),
  });

  const preview = previewQuery.data;
  const displayHtml = useMemo(() => pdfHtml || voucherHtml, [pdfHtml, voucherHtml]);

  if (previewQuery.isLoading) return <LoadingView />;

  if (result) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              router.replace(`/lead/${id}`);
            }}
            style={styles.iconBtn}
          >
            <AppIcon name="arrow-back" size={22} color="#0F172A" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Advance Voucher</Text>
            <Text style={styles.sub}>
              {result.alreadyConverted ? 'Already converted' : 'Lead converted · voucher ready'}
            </Text>
          </View>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: displayHtml, baseUrl: 'https://crm.exploremybharat.info/' }}
          style={{ flex: 1 }}
        />
        <View style={styles.footer}>
          <Pressable style={styles.doneBtn} onPress={() => router.replace(`/lead/${id}`)}>
            <Text style={styles.doneText}>Back to Lead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Convert Lead</Text>
          <Text style={styles.sub}>Advance payment + voucher (CRM same flow)</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {preview ? (
          <View style={styles.previewCard}>
            <Info label="Customer" value={preview.customerName || '—'} />
            <Info label="Package" value={preview.packageName || '—'} />
            <Info label="Destination" value={preview.destination || '—'} />
            <Info
              label="Package cost"
              value={
                preview.totalPackageCost
                  ? `₹${Number(preview.totalPackageCost).toLocaleString('en-IN')}`
                  : '—'
              }
            />
            <Info label="Quotation" value={preview.quotationNumber || '—'} />
          </View>
        ) : (
          <Text style={styles.warn}>Preview load nahi hua — phir bhi convert try kar sakte ho.</Text>
        )}

        <Text style={styles.label}>Aadhaar number (12 digit) *</Text>
        <TextInput
          value={aadhaar}
          onChangeText={(t) => setAadhaar(t.replace(/\D/g, '').slice(0, 12))}
          keyboardType="number-pad"
          placeholder="XXXXXXXXXXXX"
          style={styles.input}
          maxLength={12}
        />

        <Text style={styles.label}>Aadhaar photo</Text>
        <PhotoAttach
          image={aadhaarPhoto}
          emptyLabel="Attach Aadhaar photo"
          onPick={() => promptPickImage(setAadhaarPhoto)}
          onClear={() => setAadhaarPhoto(null)}
        />

        <Text style={styles.label}>Advance amount (₹) *</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />

        <DateTimeField
          label="Payment date"
          mode="date"
          value={paymentDate}
          onChange={setPaymentDate}
        />

        <Text style={styles.label}>Payment mode</Text>
        <View style={styles.modes}>
          {PAYMENT_MODES.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              style={[styles.modeChip, mode === m.value && styles.modeChipActive]}
            >
              <Text style={[styles.modeText, mode === m.value && styles.modeTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Payment screenshot</Text>
        <PhotoAttach
          image={screenshot}
          emptyLabel="Attach payment screenshot"
          onPick={() => promptPickImage(setScreenshot)}
          onClear={() => setScreenshot(null)}
        />

        <Text style={styles.label}>Remarks</Text>
        <TextInput
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Optional note"
          style={[styles.input, { minHeight: 70 }]}
          multiline
        />

        <Pressable
          style={styles.submit}
          disabled={convertMutation.isPending}
          onPress={() => {
            if (aadhaar.replace(/\D/g, '').length !== 12) {
              Alert.alert('Aadhaar required', 'Enter valid 12-digit Aadhaar number');
              return;
            }
            if (!Number(amount)) {
              Alert.alert('Amount required', 'Enter advance amount');
              return;
            }
            convertMutation.mutate();
          }}
        >
          <AppIcon name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.submitText}>
            {convertMutation.isPending ? 'Converting…' : 'Convert & Create Voucher'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoAttach({
  image,
  emptyLabel,
  onPick,
  onClear,
}: {
  image: PickedImage | null;
  emptyLabel: string;
  onPick: () => void;
  onClear: () => void;
}) {
  if (image) {
    return (
      <View style={styles.photoCard}>
        <Image source={{ uri: image.uri }} style={styles.photoPreview} />
        <View style={styles.photoActions}>
          <Pressable style={styles.photoBtn} onPress={onPick}>
            <AppIcon name="camera" size={16} color={PURPLE} />
            <Text style={styles.photoBtnText}>Change</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={onClear}>
            <AppIcon name="trash" size={16} color="#E11D48" />
            <Text style={[styles.photoBtnText, { color: '#E11D48' }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.attachBtn} onPress={onPick}>
      <AppIcon name="image" size={18} color={PURPLE} />
      <Text style={styles.attachText}>{emptyLabel}</Text>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  infoLabel: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  infoValue: { flex: 1, textAlign: 'right', color: '#0F172A', fontWeight: '700', fontSize: 13 },
  warn: { color: '#B45309', marginBottom: 8 },
  label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
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
  attachBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  attachText: { color: PURPLE, fontWeight: '700', fontSize: 14 },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: 160, backgroundColor: '#F1F5F9' },
  photoActions: { flexDirection: 'row', gap: 8, padding: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
  },
  photoBtnText: { fontWeight: '700', color: PURPLE, fontSize: 13 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  modeText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  modeTextActive: { color: '#fff' },
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
  footer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  doneBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: '#fff', fontWeight: '800' },
});
