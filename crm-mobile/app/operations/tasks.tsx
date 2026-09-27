import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, shadows } from '@/src/constants/theme';
import { fetchOpsTasks, type OpsTask } from '@/src/services/operations';

function due(value?: string) {
  if (!value) return 'No due date';
  try {
    return format(parseISO(value), 'dd MMM, hh:mm a');
  } catch {
    return 'No due date';
  }
}

const PRIORITY: Record<string, { bg: string; text: string }> = {
  high: { bg: '#FFF1F2', text: '#BE123C' },
  urgent: { bg: '#FFF1F2', text: '#BE123C' },
  medium: { bg: '#FFF7ED', text: '#C2410C' },
  low: { bg: '#F1F5F9', text: '#475569' },
};

export default function OpsTasksScreen() {
  const query = useQuery({ queryKey: ['ops-tasks'], queryFn: fetchOpsTasks });
  const tasks = query.data || [];
  const open = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{open} open · {tasks.length} total</Text>
        </View>
        <Pressable
          style={styles.openWeb}
          onPress={() =>
            router.push({ pathname: '/crm-web', params: { path: '/operations-manager/tasks', title: 'Tasks' } })
          }
        >
          <Ionicons name="open-outline" size={18} color="#7C3AED" />
        </Pressable>
      </View>
      {query.isLoading ? (
        <LoadingView />
      ) : query.isError ? (
        <Pressable onPress={() => query.refetch()}>
          <EmptyState icon="cloud-offline-outline" title="Could not load tasks" subtitle="Tap to retry." />
        </Pressable>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor="#7C3AED" />}
          ListEmptyComponent={<EmptyState icon="list-outline" title="No tasks" subtitle="Assigned trip tasks will show here." />}
          renderItem={({ item }) => <TaskCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function TaskCard({ item }: { item: OpsTask }) {
  const done = item.status === 'completed';
  const pri = PRIORITY[(item.priority || '').toLowerCase()] || PRIORITY.low;
  return (
    <View style={[styles.card, shadows.card, done && styles.cardDone]}>
      <View style={[styles.mark, { backgroundColor: done ? '#ECFDF5' : '#F5F3FF' }]}>
        <Ionicons name={done ? 'checkmark' : 'ellipse'} size={14} color={done ? '#059669' : '#7C3AED'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, done && styles.nameDone]}>{item.title || 'Task'}</Text>
        <Text style={styles.meta}>{due(item.dueDate)}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: done ? '#ECFDF5' : pri.bg }]}>
        <Text style={[styles.pillText, { color: done ? '#047857' : pri.text }]}>
          {done ? 'done' : item.priority || item.status || 'open'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F2FB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  openWeb: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 28, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  cardDone: { opacity: 0.72 },
  mark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800', color: '#0F172A' },
  nameDone: { textDecorationLine: 'line-through', color: '#64748B' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
});
