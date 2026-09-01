import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROLE_LABELS } from '@/src/constants/roles';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { fetchProfile } from '@/src/services/leads';
import { fetchUnreadCount } from '@/src/services/notifications';
import type { UserRole } from '@/src/types';

export default function ProfileScreen() {
  const { user, logout, apiUrl, tenantSubdomain } = useAuth();
  const role = user!.role as UserRole;

  const { data: profile } = useQuery({
    queryKey: ['profile', role],
    queryFn: () => fetchProfile(role),
    enabled: !!user,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
  });

  const displayUser = profile || user;

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayUser?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayUser?.name}</Text>
          <Text style={styles.email}>{displayUser?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{ROLE_LABELS[role] || displayUser?.role}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <Link href="/notifications" asChild>
            <Pressable style={styles.menuRow}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.menuText}>Notifications</Text>
              {(unreadQuery.data ?? 0) > 0 ? (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{unreadQuery.data}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <InfoRow icon="server-outline" label="API URL" value={apiUrl} />
          <InfoRow
            icon="business-outline"
            label="Tenant"
            value={tenantSubdomain || 'Default / single company'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {displayUser?.phone ? (
            <InfoRow icon="call-outline" label="Phone" value={displayUser.phone} />
          ) : null}
          <Pressable onPress={confirmLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>LeadMang CRM Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  rolePill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  roleText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  section: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  infoValue: { marginTop: 2, fontSize: 14, color: colors.text, fontWeight: '600' },
  logoutBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  menuBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: 12,
  },
});
