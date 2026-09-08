import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { getMenuForRole, type MenuItem } from '@/src/constants/crmMenu';
import { ROLE_LABELS } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';
import type { UserRole } from '@/src/types';

const PURPLE = '#7C3AED';
const BG = '#F7F8FC';

function openItem(item: MenuItem) {
  if (item.native) {
    const [pathname, qs] = item.native.split('?');
    if (qs) {
      const params = Object.fromEntries(new URLSearchParams(qs).entries());
      router.push({ pathname: pathname as never, params });
    } else {
      router.push(pathname as never);
    }
    return;
  }
  if (item.webPath) {
    router.push({
      pathname: '/crm-web',
      params: { path: item.webPath, title: item.label },
    });
  }
}

export default function MenuScreen() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const menu = useMemo(() => getMenuForRole(role), [role]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'my-leads': true,
    'lead-mgmt': true,
    quotations: true,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>CRM Menu</Text>
        <Text style={styles.sub}>
          {role ? ROLE_LABELS[role] : 'CRM'} · same as website sidebar
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {menu.map((item) => {
          if (item.children?.length) {
            const open = !!openGroups[item.id];
            return (
              <View key={item.id} style={styles.group}>
                <Pressable
                  style={styles.groupHeader}
                  onPress={() => setOpenGroups((s) => ({ ...s, [item.id]: !open }))}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconWrap}>
                      <AppIcon name={item.icon} size={18} color={PURPLE} />
                    </View>
                    <Text style={styles.groupTitle}>{item.label}</Text>
                  </View>
                  <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                </Pressable>
                {open
                  ? item.children.map((child) => (
                      <Pressable key={child.id} style={styles.childRow} onPress={() => openItem(child)}>
                        <AppIcon name={child.icon || 'ellipse'} size={16} color="#64748B" />
                        <Text style={styles.childLabel}>{child.label}</Text>
                        <AppIcon
                          name={child.webPath ? 'globe-outline' : 'chevron-forward'}
                          size={16}
                          color="#CBD5E1"
                        />
                      </Pressable>
                    ))
                  : null}
              </View>
            );
          }

          return (
            <Pressable key={item.id} style={styles.item} onPress={() => openItem(item)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <AppIcon name={item.icon} size={18} color={PURPLE} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <AppIcon
                name={item.webPath ? 'globe-outline' : 'chevron-forward'}
                size={18}
                color="#CBD5E1"
              />
            </Pressable>
          );
        })}

        <Text style={styles.footerNote}>
          Globe icons open the full CRM website feature inside the app (authenticated). Native screens open
          faster app pages.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  sub: { marginTop: 2, fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  group: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  groupTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  childLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    textAlign: 'center',
  },
});
