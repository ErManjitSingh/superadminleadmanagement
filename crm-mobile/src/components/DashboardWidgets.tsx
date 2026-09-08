import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';

export function formatMoney(value?: number) {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function MetricTile({
  label,
  value,
  icon,
  tint,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  subtitle?: string;
}) {
  return (
    <View style={[styles.tile, shadows.card]}>
      <View style={styles.tileTop}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      </View>
      <Text style={styles.tileValue} numberOfLines={1}>
        {typeof value === 'string' || typeof value === 'number' ? String(value) : '—'}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {subtitle ? <Text style={styles.tileSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function HeroProgress({
  title,
  subtitle,
  progress,
  chips,
}: {
  title: string;
  subtitle: string;
  progress: number;
  chips: Array<{ label: string; value: string | number }>;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress || 0)));
  return (
    <LinearGradient colors={['#5B21B6', '#7C3AED', '#4F46E5']} style={styles.hero}>
      <Text style={styles.heroEyebrow}>LIVE PIPELINE</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSub}>{subtitle}</Text>

      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>Monthly target</Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.chipRow}>
        {chips.map((c) => (
          <View key={c.label} style={styles.chip}>
            <Text style={styles.chipValue}>
              {typeof c.value === 'string' || typeof c.value === 'number' ? String(c.value) : '—'}
            </Text>
            <Text style={styles.chipLabel}>{c.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

export function AlertChip({
  label,
  count,
  tone,
  onPress,
}: {
  label: string;
  count: number;
  tone: 'rose' | 'amber' | 'violet' | 'sky';
  onPress?: () => void;
}) {
  const map = {
    rose: { bg: '#FFF1F2', fg: '#E11D48', border: '#FECDD3' },
    amber: { bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
    violet: { bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
    sky: { bg: '#F0F9FF', fg: '#0284C7', border: '#BAE6FD' },
  }[tone] || { bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.alertChip, { backgroundColor: map.bg, borderColor: map.border }]}
    >
      <Text style={[styles.alertCount, { color: map.fg }]}>{String(count ?? 0)}</Text>
      <Text style={[styles.alertLabel, { color: map.fg }]}>{String(label || '')}</Text>
    </Pressable>
  );
}

export function PipelineBars({
  stages,
}: {
  stages: Array<{ name: string; value: number; color: string }>;
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  if (!stages.length) {
    return <Text style={styles.emptyHint}>Pipeline data will appear as leads move stages</Text>;
  }
  return (
    <View style={styles.pipelineBox}>
      {stages.map((stage) => (
        <View key={stage.name} style={styles.pipelineRow}>
          <View style={styles.pipelineMeta}>
          <Text style={styles.pipelineName}>{String(stage.name)}</Text>
          <Text style={styles.pipelineValue}>{String(stage.value ?? 0)}</Text>
          </View>
          <View style={styles.pipelineTrack}>
            <View
              style={[
                styles.pipelineFill,
                {
                  width: `${Math.max(8, (stage.value / max) * 100)}%`,
                  backgroundColor: stage.color || colors.primary,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SourceList({
  sources,
}: {
  sources: Array<{ name: string; value: number; pct?: number; color?: string }>;
}) {
  if (!sources.length) {
    return <Text style={styles.emptyHint}>Lead sources will show once leads start coming in</Text>;
  }
  const total = sources.reduce((s, x) => s + Number(x.value || 0), 0) || 1;
  return (
    <View style={styles.sourceBox}>
      {sources.slice(0, 5).map((src, i) => {
        const pct = src.pct ?? Math.round((Number(src.value) / total) * 100);
        const color = src.color || ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'][i % 5];
        return (
          <View key={`${src.name}-${i}`} style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: color }]} />
            <Text style={styles.sourceName} numberOfLines={1}>
              {String(src.name)}
            </Text>
            <Text style={styles.sourceValue}>{String(src.value ?? 0)}</Text>
            <Text style={styles.sourcePct}>{String(pct)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tileTop: { marginBottom: spacing.sm },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  tileLabel: { marginTop: 2, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tileSub: { marginTop: 2, fontSize: 11, color: colors.textMuted },

  hero: {
    marginHorizontal: spacing.lg,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 8,
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSub: { marginTop: 4, color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  progressHead: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  progressPct: { color: '#fff', fontSize: 16, fontWeight: '800' },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FDE68A', borderRadius: 999 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  chipValue: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chipLabel: { marginTop: 2, color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' },

  alertChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 108,
    marginRight: 8,
  },
  alertCount: { fontSize: 18, fontWeight: '800' },
  alertLabel: { marginTop: 2, fontSize: 11, fontWeight: '700' },

  pipelineBox: { gap: 12 },
  pipelineRow: { gap: 6 },
  pipelineMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  pipelineName: { fontSize: 13, fontWeight: '700', color: colors.text },
  pipelineValue: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  pipelineTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    overflow: 'hidden',
  },
  pipelineFill: { height: '100%', borderRadius: 999 },

  sourceBox: { gap: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceDot: { width: 8, height: 8, borderRadius: 4 },
  sourceName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  sourceValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  sourcePct: { width: 40, textAlign: 'right', fontSize: 12, color: colors.textMuted, fontWeight: '700' },

  emptyHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
