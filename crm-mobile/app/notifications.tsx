import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => fetchNotificationsList(),
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerRight: () =>
            items.length ? (
              <Pressable onPress={() => markAllMutation.mutate()} style={{ marginRight: 12 }}>
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
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
              title="No notifications"
              subtitle="Alerts about leads and follow-ups will appear here"
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
      <Text style={styles.title}>{item.title}</Text>
      {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
      <Text style={styles.time}>
        {item.createdAt ? format(parseISO(item.createdAt), 'dd MMM yyyy, h:mm a') : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  },
  unread: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5FF',
  },
  pressed: { opacity: 0.9 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  message: { marginTop: 6, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  time: { marginTop: spacing.sm, fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});
