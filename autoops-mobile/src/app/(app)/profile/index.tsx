import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemePreference } from '@/hooks/use-theme-preference';
import { useSession } from '@/hooks/use-session';
import { clearToken } from '@/lib/auth';

function initialsOf(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { name, email, role } = useSession();
  const { preference, setPreference } = useThemePreference();
  const [showConfirm, setShowConfirm] = useState(false);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  async function doLogout() {
    setShowConfirm(false);
    await clearToken();
    router.replace('/login');
  }

  const roleLabel = role === 'admin' ? 'Admin' : role === 'mechanic' ? 'Mechanic' : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.avatarText, { color: theme.text }]}>{initialsOf(name)}</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{name ?? '—'}</Text>
        {email ? <Text style={[styles.email, { color: theme.textMuted }]}>{email}</Text> : null}
        <View style={[styles.role, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <Text style={[styles.roleText, { color: theme.textSecondary }]}>{roleLabel}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.themeSection}>
          <Text style={[styles.themeLabel, { color: theme.textSecondary }]}>Theme</Text>
          <View style={[styles.themePicker, { backgroundColor: theme.backgroundElement }]}>
            {themeOptions.map(({ value, label }) => {
              const active = preference === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPreference(value)}
                  style={[
                    styles.themeBtn,
                    active && { backgroundColor: theme.background },
                  ]}>
                  <Text
                    style={[
                      styles.themeBtnText,
                      { color: active ? theme.text : theme.textMuted },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Pressable
          onPress={() => setShowConfirm(true)}
          style={[styles.logout, { borderColor: 'rgba(226,75,74,0.3)' }]}>
          <Text style={[styles.logoutText, { color: theme.danger }]}>Log out</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 15, fontWeight: '500' },
  name: { fontSize: 13, fontWeight: '500' },
  email: { fontSize: 10, marginTop: 2 },
  role: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 6,
  },
  roleText: { fontSize: 10, fontWeight: '500' },
  divider: { height: 0.5, alignSelf: 'stretch', marginTop: 14, marginBottom: 14 },
  themeSection: { alignSelf: 'stretch', gap: 8 },
  themeLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  themePicker: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  themeBtnText: { fontSize: 12, fontWeight: '500' },
  logout: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    backgroundColor: 'rgba(226,75,74,0.06)',
    alignItems: 'center',
  },
  logoutText: { fontSize: 12, fontWeight: '500' },
});
