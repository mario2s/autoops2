import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ApiError, post } from '@/lib/api';
import type { Part } from '@/lib/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (part: Part) => void;
};

export function PartModal({ visible, onClose, onCreated }: Props) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setError(null);
    }
  }, [visible]);

  async function submit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await post<{ data: Part }>('/api/v1/catalog/parts', { name: name.trim() });
      onCreated(res.data);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NAME_CONFLICT') {
        setError('A part with this name already exists');
      } else {
        setError(e instanceof ApiError ? e.message : 'Failed to create part');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.text }]}>New part</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Part name"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={!name.trim() || submitting}
            style={[styles.submit, { opacity: !name.trim() || submitting ? 0.6 : 1 }]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add to catalog</Text>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: { color: '#DC2626', fontSize: 14 },
  submit: {
    backgroundColor: '#208AEF',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
