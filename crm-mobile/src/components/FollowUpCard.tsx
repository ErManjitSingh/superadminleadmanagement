import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import type { FollowUp } from '@/src/types';

const priorityColors = {
  high: colors.danger,
  medium: colors.warning,
  low: colors.info,
};

export function FollowUpCard({
  item,
  onPress,
  onComplete,
}: {
  item: FollowUp;
  onPress?: () => void;
  onComplete?: () => void;
}) {
  const leadName =
    typeof item.lead === 'object' && item.lead && 'name' in item.lead
      ? item.lead.name
      : 'Lead';
  const destination =
    typeof item.lead === 'object' && item.lead && 'destination' in item.lead
      ? item.lead.destination
      : undefined;
  const priority = (item.priority || 'medium') as keyof typeof priorityColors;
  const scheduled = item.scheduledAt ? format(parseISO(item.scheduledAt), 'dd MMM · h:mm a') : '—';
  const canComplete = item.status !== 'completed' && !!onComplete;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, shadows.card, pressed && onPress && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.priorityBar, { backgroundColor: priorityColors[priority] || colors.warning }]} />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {leadName}
          </Text>
          {destination ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {destination}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{scheduled}</Text>
            <View style={[styles.statusPill, item.status === 'completed' && styles.statusDone]}>
              <Text style={styles.statusText}>{item.status || 'pending'}</Text>
            </View>
          </View>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
          {canComplete ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onComplete();
              }}
              style={styles.completeBtn}
            >
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.completeText}>Mark complete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row' },
  priorityBar: { width: 4 },
  content: { flex: 1, padding: spacing.lg },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  statusPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  notes: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  completeBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});
