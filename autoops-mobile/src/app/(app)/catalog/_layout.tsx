import { Slot, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

const TABS = [
  { key: 'parts', label: 'Parts', path: '/catalog/parts' },
  { key: 'clients', label: 'Clients', path: '/catalog/clients' },
  { key: 'vehicles', label: 'Vehicles', path: '/catalog/vehicles' },
] as const;

export default function CatalogLayout() {
  const theme = useTheme();
  const pathname = usePathname();

  // Hide top tabs on edit screens (they are deeper)
  const isEditScreen = /\/catalog\/(parts|clients|vehicles)\/[^/]+\/edit$/.test(pathname);

  const active = TABS.find((t) => pathname.startsWith(t.path));

  if (isEditScreen) {
    return <Slot />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Catalog</Text>
      </View>
      <View style={[styles.tabBar, { borderBottomColor: theme.backgroundElement }]}>
        {TABS.map((t) => {
          const isActive = active?.key === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => router.replace(t.path as any)}
              style={[
                styles.tab,
                isActive && { borderBottomColor: '#208AEF' },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? '#208AEF' : theme.textSecondary },
                ]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  content: { flex: 1 },
});
