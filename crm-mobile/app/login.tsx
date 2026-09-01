import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage, useAuth } from '@/src/context/AuthContext';
import { colors, radius, spacing } from '@/src/constants/theme';

export default function LoginScreen() {
  const { login, setApiUrl, setTenantSubdomain, apiUrl, tenantSubdomain } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState(tenantSubdomain);
  const [serverUrl, setServerUrl] = useState(apiUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      if (showAdvanced) {
        await setApiUrl(serverUrl);
        await setTenantSubdomain(tenant);
      }
      await login(email.trim(), password, tenant.trim() || undefined);
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="briefcase" size={34} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>LeadMang CRM</Text>
            <Text style={styles.heroSubtitle}>Manage leads, follow-ups & pipeline on the go</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@company.com"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Pressable onPress={() => setShowAdvanced((v) => !v)} style={styles.advancedToggle}>
              <Text style={styles.advancedText}>
                {showAdvanced ? 'Hide' : 'Show'} server settings
              </Text>
              <Ionicons
                name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </Pressable>

            {showAdvanced ? (
              <View style={styles.advancedBox}>
                <Text style={styles.label}>Company subdomain (optional)</Text>
                <TextInput
                  value={tenant}
                  onChangeText={setTenant}
                  autoCapitalize="none"
                  placeholder="yourcompany"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <Text style={styles.label}>API URL</Text>
                <TextInput
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  placeholder="https://yourdomain.com/api"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.button, (pressed || loading) && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + 8,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
  },
  form: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    color: colors.text,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  advancedText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  advancedBox: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
