import { StyleSheet, Text, View } from 'react-native';
import { getLeadStatusColor, getLeadStatusLabel } from '@/src/constants/leadStatus';
import { colors, radius, spacing } from '@/src/constants/theme';

export function StatusBadge({ status }: { status?: string }) {
  const color = getLeadStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{getLeadStatusLabel(status)}</Text>
    </View>
  );
}

export function HotBadge() {
  return (
    <View style={styles.hotBadge}>
      <Text style={styles.hotText}>HOT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  hotBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  hotText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hot,
    letterSpacing: 0.5,
  },
});
