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
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get, patch } from '@/lib/api';
import { UNKNOWN_CLIENT_ID } from '@/lib/constants';
import type { Client, Paginated, Vehicle } from '@/lib/types';

async function searchClients(q: string) {
  const res = await get<Paginated<Client>>(
    `/api/v1/catalog/clients?search=${encodeURIComponent(q)}&pageSize=8`,
  );
  return res.data.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone ?? undefined }));
}

export default function EditVehicleScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, loaded } = useSession();

  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientText, setClientText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && role && role !== 'admin') {
      router.replace('/catalog/vehicles');
    }
  }, [loaded, role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await get<{ data: Vehicle }>(`/api/v1/catalog/vehicles/${id}`);
        const v = res.data;
        setPlate(v.licensePlate ?? '');
        setDescription(v.description ?? '');
        setMake(v.make ?? '');
        setModel(v.model ?? '');
        setYear(v.year ? String(v.year) : '');
        setVin(v.vin ?? '');
        setClientId(v.clientId);
        if (v.clientId === UNKNOWN_CLIENT_ID) {
          setClientText('Unknown');
        } else {
          try {
            const cr = await get<{ data: Client }>(`/api/v1/catalog/clients/${v.clientId}`);
            setClientText(cr.data.name);
          } catch {
            setClientText('');
          }
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load vehicle');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function save() {
    if (submitting) return;
    if (!plate.trim() && !description.trim()) {
      setError('License plate or description is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        licensePlate: plate.trim(),
        description: description.trim(),
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year, 10) : null,
        vin: vin.trim(),
      };
      if (clientId) body.clientId = clientId;
      await patch<{ data: Vehicle }>(`/api/v1/catalog/vehicles/${id}`, body);
      toast.show('Vehicle updated', 'success');
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
        <Text style={[styles.title, { color: theme.text }]}>Edit vehicle</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <ListState state="loading" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="License plate" theme={theme}>
            <TextInput
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Field>
          <Field label="Description" theme={theme}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Field>
          <View style={styles.rowGroup}>
            <View style={styles.flex}>
              <Field label="Make" theme={theme}>
                <TextInput
                  value={make}
                  onChangeText={setMake}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Model" theme={theme}>
                <TextInput
                  value={model}
                  onChangeText={setModel}
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
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </Field>
            </View>
          </View>
          <SearchableSelect
            label="Client"
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
          <Pressable
            onPress={() => {
              setClientId(UNKNOWN_CLIENT_ID);
              setClientText('Unknown');
            }}
            style={styles.unknownBtn}>
            <Text style={[styles.unknownText, { color: theme.textSecondary }]}>
              Reassign to Unknown
            </Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={save}
            disabled={submitting}
            style={[
              styles.save,
              { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 },
            ]}>
            {submitting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Text style={[styles.saveText, { color: theme.accentText }]}>Save</Text>
            )}
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
  rowGroup: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  unknownBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  unknownText: { fontSize: 13, textDecorationLine: 'underline' },
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
