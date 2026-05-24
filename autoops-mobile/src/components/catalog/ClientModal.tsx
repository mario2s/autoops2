import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ApiError, post } from '@/lib/api';
import type { Client } from '@/lib/types';

type Props = {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (client: Client) => void;
};

export function ClientModal({ visible, initialName, onClose, onCreated }: Props) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setPhone('');
      setEmail('');
      setNotes('');
      setError(null);
    }
  }, [visible, initialName]);

  async function submit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await post<{ data: Client }>('/api/v1/catalog/clients', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create client');
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
          <Text style={[styles.title, { color: theme.text }]}>New client</Text>
          <ScrollView contentContainerStyle={styles.form}>
            <Field label="Name *" theme={theme}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Client name"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <Field label="Phone" theme={theme}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <Field label="Email" theme={theme}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <Field label="Notes" theme={theme}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement, height: 80 },
                ]}
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={submit}
              disabled={!name.trim() || submitting}
              style={[styles.submit, { opacity: !name.trim() || submitting ? 0.6 : 1 }]}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add client</Text>}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: { textSecondary: string } }) {
  return (
    <View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  form: { gap: 14, paddingBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
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
    marginTop: 4,
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
