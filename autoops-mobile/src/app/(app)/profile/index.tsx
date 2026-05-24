import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/hooks/use-session';
import { clearToken } from '@/lib/auth';

export default function ProfileScreen() {
  const theme = useTheme();
  const { name, email, role } = useSession();
  const [showConfirm, setShowConfirm] = useState(false);

  async function doLogout() {
    setShowConfirm(false);
    await clearToken();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>Profile</Text>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.name, { color: theme.text }]}>{name ?? '—'}</Text>
          <View style={styles.row}>
            <View
              style={[
                styles.badge,
                { backgroundColor: role === 'admin' ? '#DBEAFE' : '#E0E7FF' },
              ]}>
              <Text style={[styles.badgeText, { color: role === 'admin' ? '#1E40AF' : '#3730A3' }]}>
                {role === 'admin' ? 'Admin' : role === 'mechanic' ? 'Mechanic' : '—'}
              </Text>
            </View>
          </View>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{email ?? ''}</Text>
        </View>

        <View style={styles.flex} />

        <Pressable onPress={() => setShowConfirm(true)} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={showConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        destructive
        onConfirm={doLogout}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 24 },
  heading: { fontSize: 28, fontWeight: '700' },
  card: {
    borderRadius: 14,
    padding: 20,
    gap: 8,
  },
  name: { fontSize: 22, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  email: { fontSize: 14, marginTop: 4 },
  flex: { flex: 1 },
  logout: {
    backgroundColor: '#DC2626',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
