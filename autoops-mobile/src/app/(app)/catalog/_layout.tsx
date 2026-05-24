import { Slot, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CatalogCtaProvider,
  useCatalogCta,
} from '@/components/catalog/CatalogCtaContext';
import { useTheme } from '@/hooks/use-theme';

const TABS = [
  { key: 'parts', label: 'Parts', path: '/catalog/parts' },
  { key: 'clients', label: 'Clients', path: '/catalog/clients' },
  { key: 'vehicles', label: 'Vehicles', path: '/catalog/vehicles' },
] as const;

function CatalogInner() {
  const theme = useTheme();
  const pathname = usePathname();
  const { cta } = useCatalogCta();

  const isEditScreen = /\/catalog\/(parts|clients|vehicles)\/[^/]+\/edit$/.test(pathname);
  const active = TABS.find((t) => pathname.startsWith(t.path));

  if (isEditScreen) {
    return <Slot />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Catalog</Text>
        {cta ? (
          <Pressable
            onPress={cta.onPress}
            style={[styles.headerBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.headerBtnText, { color: theme.accentText }]}>{cta.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {TABS.map((t) => {
          const isActive = active?.key === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => router.replace(t.path as any)}
              style={[styles.tab, isActive && { borderBottomColor: theme.text }]}>
              <Text
                style={[styles.tabText, { color: isActive ? theme.text : theme.textMuted }]}>
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

export default function CatalogLayout() {
  return (
    <CatalogCtaProvider>
      <CatalogInner />
    </CatalogCtaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 16, fontWeight: '500' },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerBtnText: { fontSize: 11, fontWeight: '500' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 11, fontWeight: '500' },
  content: { flex: 1 },
});
