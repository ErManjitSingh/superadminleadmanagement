import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HotBadge, StatusBadge } from '@/src/components/StatusBadge';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import type { Lead } from '@/src/types';

function formatBudget(value?: number) {
  if (!value) return '—';
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/lead/${lead._id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, shadows.card, pressed && styles.pressed]}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {lead.name}
            </Text>
            {lead.leadId ? <Text style={styles.leadId}>#{lead.leadId}</Text> : null}
          </View>
          {lead.isHot ? <HotBadge /> : null}
        </View>

        <View style={styles.metaRow}>
          {lead.destination ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {lead.destination}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatBudget(lead.budget)}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <StatusBadge status={lead.status} />
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  leadId: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '70%',
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
