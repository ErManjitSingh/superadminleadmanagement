import { useEffect } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Redirects to native quotation builder (same 6 steps + APIs as website). */
export default function CreateQuotationScreen() {
  const { leadId, quoteId } = useLocalSearchParams<{ leadId?: string; quoteId?: string }>();

  useEffect(() => {
    router.replace({
      pathname: '/quotation/builder',
      params: {
        ...(leadId ? { leadId } : {}),
        ...(quoteId ? { quoteId } : {}),
      },
    });
  }, [leadId, quoteId]);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={styles.text}>Opening quotation builder…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  text: { fontWeight: '700', color: '#334155' },
});
