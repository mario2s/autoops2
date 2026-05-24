import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { formatDateTime } from '@/lib/format';
import type { Part } from '@/lib/types';

export default function EditPartScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, loaded } = useSession();

  const [part, setPart] = useState<Part | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && role && role !== 'admin') {
      router.replace('/catalog/parts');
    }
  }, [loaded, role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await get<{ data: Part }>(`/api/v1/catalog/parts/${id}`);
        setPart(res.data);
        setName(res.data.name);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load part');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function save() {
    if (!name.trim() || !part || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await patch<{ data: Part }>(`/api/v1/catalog/parts/${part.id}`, { name: name.trim() });
      toast.show('Part updated', 'success');
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
        <Text style={[styles.title, { color: theme.text }]}>Edit part</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <ListState state="loading" />
      ) : !part ? (
        <ListState state="error" message={error ?? 'Part not found'} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Part name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Part name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <Text style={[styles.warn, { color: '#92400E' }]}>
            Renaming this part updates all historical orders.
          </Text>
          <View style={[styles.meta, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Added</Text>
            <Text style={[styles.metaVal, { color: theme.text }]}>{formatDateTime(part.createdAt)}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={save}
            disabled={submitting || !name.trim()}
            style={[
              styles.save,
              { backgroundColor: theme.accent, opacity: submitting || !name.trim() ? 0.6 : 1 },
            ]}>
            {submitting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Text style={[styles.saveText, { color: theme.accentText }]}>Save</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
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
  content: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  warn: { fontSize: 13, lineHeight: 18 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
  },
  metaLabel: { fontSize: 13 },
  metaVal: { fontSize: 13, fontWeight: '500' },
  error: { color: '#DC2626', fontSize: 14 },
  save: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { fontWeight: '500', fontSize: 13 },
});
