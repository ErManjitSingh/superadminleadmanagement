import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingView } from '@/src/components/LoadingView';
import { colors, radius, shadows, spacing } from '@/src/constants/theme';
import {
  fetchNotificationsList,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/src/services/notifications';
import type { NotificationItem } from '@/src/types';

function iconForType(type?: string): keyof typeof Ionicons.glyphMap {
  const t = (type || '').toLowerCase();
  if (t.includes('follow')) return 'calendar';
  if (t.includes('quote') || t.includes('quotation')) return 'document-text';
  if (t.includes('assign')) return 'person-add';
  if (t.includes('hot')) return 'flame';
  if (t.includes('lead')) return 'people';
  return 'notifications';
}

function tintForType(type?: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('follow')) return colors.info;
  if (t.includes('quote')) return '#8B5CF6';
  if (t.includes('hot')) return colors.hot;
  if (t.includes('assign')) return '#0EA5E9';
  return colors.primary;
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => fetchNotificationsList({ limit: 50 }),
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  if (query.isLoading) return <LoadingView />;

  const items = query.data?.items ?? [];
  const unread = items.filter((i) => !i.read).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerRight: () =>
            unread ? (
              <Pressable onPress={() => markAllMutation.mutate()} style={{ marginRight: 12 }}>
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {unread > 0 ? (
          <View style={styles.banner}>
            <Ionicons name="notifications" size={16} color={colors.primary} />
            <Text style={styles.bannerText}>{unread} unread CRM alerts</Text>
          </View>
        ) : null}
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => !item.read && markReadMutation.mutate(item._id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No notifications yet"
              subtitle="Leads, follow-ups, quotations and assignments will show up here"
              icon="notifications-outline"
            />
          }
          contentContainerStyle={items.length ? styles.list : styles.listEmpty}
        />
      </SafeAreaView>
    </>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const tint = tintForType(item.type);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        !item.read && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={iconForType(item.type)} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
        <Text style={styles.time}>
          {item.createdAt ? format(parseISO(item.createdAt), 'dd MMM yyyy, h:mm a') : ''}
        </Text>
      </View>
      {!item.read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FB' },
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: 4,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  bannerText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  listEmpty: { flexGrow: 1 },
  markAll: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  unread: {
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF5FF',
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  message: { marginTop: 6, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  time: { marginTop: spacing.sm, fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
