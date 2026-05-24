import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListState } from '@/components/ui/ListState';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get, patch } from '@/lib/api';
import type { Client } from '@/lib/types';

export default function EditClientScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, loaded } = useSession();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && role && role !== 'admin') {
      router.replace('/catalog/clients');
    }
  }, [loaded, role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await get<{ data: Client }>(`/api/v1/catalog/clients/${id}`);
        setName(res.data.name);
        setPhone(res.data.phone ?? '');
        setEmail(res.data.email ?? '');
        setNotes(res.data.notes ?? '');
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load client');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function save() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await patch<{ data: Client }>(`/api/v1/catalog/clients/${id}`, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
      toast.show('Client updated', 'success');
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.text }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit client</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <ListState state="loading" />
      ) : error && !name ? (
        <ListState state="error" message={error} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Field label="Name *" theme={theme}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Field>
          <Field label="Phone" theme={theme}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Field>
          <Field label="Email" theme={theme}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Field>
          <Field label="Notes" theme={theme}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.backgroundElement, height: 100 },
              ]}
            />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={save}
            disabled={submitting || !name.trim()}
            style={[styles.save, { opacity: submitting || !name.trim() ? 0.6 : 1 }]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  theme,
}: {
  label: string;
  children: React.ReactNode;
  theme: { textSecondary: string };
}) {
  return (
    <View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 6, minWidth: 60 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  spacer: { minWidth: 60 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: { color: '#DC2626', fontSize: 14 },
  save: {
    backgroundColor: '#208AEF',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
