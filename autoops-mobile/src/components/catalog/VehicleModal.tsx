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

import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get, post } from '@/lib/api';
import type { Client, Paginated, Vehicle } from '@/lib/types';

type Props = {
  visible: boolean;
  initialDescription?: string;
  initialClient?: { id: string; name: string } | null;
  onClose: () => void;
  onCreated: (vehicle: Vehicle) => void;
};

async function searchClients(q: string) {
  const res = await get<Paginated<Client>>(`/api/v1/catalog/clients?search=${encodeURIComponent(q)}&pageSize=8`);
  return res.data.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone ?? undefined }));
}

export function VehicleModal({
  visible,
  initialDescription,
  initialClient,
  onClose,
  onCreated,
}: Props) {
  const theme = useTheme();
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [clientText, setClientText] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPlate('');
      setDescription(initialDescription ?? '');
      setMake('');
      setModel('');
      setYear('');
      setVin('');
      setClientText(initialClient?.name ?? '');
      setClientId(initialClient?.id ?? null);
      setError(null);
    }
  }, [visible, initialDescription, initialClient]);

  async function submit() {
    if (submitting) return;
    if (!plate.trim() && !description.trim()) {
      setError('License plate or description is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        licensePlate: plate.trim() || undefined,
        description: description.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        vin: vin.trim() || undefined,
      };
      if (clientId) body.clientId = clientId;
      const res = await post<{ data: Vehicle }>('/api/v1/catalog/vehicles', body);
      onCreated(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create vehicle');
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
          <Text style={[styles.title, { color: theme.text }]}>New vehicle</Text>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Field label="License plate" theme={theme}>
              <TextInput
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <Field label="Description" theme={theme}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <View style={styles.rowGroup}>
              <View style={styles.flex}>
                <Field label="Make" theme={theme}>
                  <TextInput
                    value={make}
                    onChangeText={setMake}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Model" theme={theme}>
                  <TextInput
                    value={model}
                    onChangeText={setModel}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                </Field>
              </View>
            </View>
            <View style={styles.rowGroup}>
              <View style={styles.flex}>
                <Field label="Year" theme={theme}>
                  <TextInput
                    value={year}
                    onChangeText={setYear}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="VIN" theme={theme}>
                  <TextInput
                    value={vin}
                    onChangeText={setVin}
                    autoCapitalize="characters"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                </Field>
              </View>
            </View>
            <SearchableSelect
              label="Client (leave blank for Unknown)"
              value={clientText}
              onChangeText={(t) => {
                setClientText(t);
                setClientId(null);
              }}
              onSelect={(item) => {
                setClientId(item.id);
                setClientText(item.label);
              }}
              fetcher={searchClients}
              placeholder="Search clients"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={submit}
              disabled={submitting}
              style={[
                styles.submit,
                { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 },
              ]}>
              {submitting ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <Text style={[styles.submitText, { color: theme.accentText }]}>Add vehicle</Text>
              )}
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
  rowGroup: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  error: { color: '#DC2626', fontSize: 14 },
  submit: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: { fontWeight: '500', fontSize: 13 },
});
