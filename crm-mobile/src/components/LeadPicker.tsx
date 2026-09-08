import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLeads } from '@/src/services/leads';
import type { Lead, UserRole } from '@/src/types';

const PURPLE = '#7C3AED';

type Props = {
  visible: boolean;
  role: UserRole;
  onClose: () => void;
  onSelect: (lead: Lead) => void;
};

export function LeadPicker({ visible, role, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setDebounced('');
    }
  }, [visible]);

  const query = useQuery({
    queryKey: ['lead-picker', role, debounced],
    queryFn: () => fetchLeads(role, { page: 1, limit: 30, search: debounced || undefined }),
    enabled: visible && !!role,
  });

  const items = query.data?.items || [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Select lead</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone, destination…"
            placeholderTextColor="#94A3B8"
            style={styles.search}
            autoFocus
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={PURPLE} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={items.length ? styles.list : styles.emptyList}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No leads found</Text>
                <Text style={styles.emptySub}>Try a different name or phone</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name || 'L').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name || 'Lead'}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.phone, item.destination].filter(Boolean).join(' · ') || 'No details'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  search: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  emptySub: { marginTop: 6, fontSize: 13, color: '#94A3B8' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  name: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  meta: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
});
