import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ClientModal } from '@/components/catalog/ClientModal';
import { PartModal } from '@/components/catalog/PartModal';
import { VehicleModal } from '@/components/catalog/VehicleModal';
import { PartRow, type PartRowValue } from '@/components/orders/PartRow';
import { ServiceRow, type ServiceRowValue } from '@/components/orders/ServiceRow';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get, patch, post } from '@/lib/api';
import { UNKNOWN_CLIENT_ID } from '@/lib/constants';
import { formatCurrency, vehicleLabel } from '@/lib/format';
import type {
  Client,
  CreateOrderInput,
  OrderDetail,
  Paginated,
  Part,
  Role,
  UpdateOrderInput,
  Vehicle,
} from '@/lib/types';

type Mode = 'create' | 'edit';

type Props = {
  mode: Mode;
  role: Role | undefined;
  orderId?: string;
  initialOrder?: OrderDetail;
};

async function searchVehicles(q: string) {
  const res = await get<Paginated<Vehicle>>(
    `/api/v1/catalog/vehicles?search=${encodeURIComponent(q)}&pageSize=8`,
  );
  return res.data.map((v) => ({
    id: v.id,
    label: vehicleLabel(v),
    sublabel: [v.make, v.model, v.year].filter(Boolean).join(' '),
  }));
}

async function searchClients(q: string) {
  const res = await get<Paginated<Client>>(
    `/api/v1/catalog/clients?search=${encodeURIComponent(q)}&pageSize=8`,
  );
  return res.data.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone ?? undefined }));
}

function emptyPart(): PartRowValue {
  return { catalogPartId: null, partName: '', qty: '1', unitPrice: '0' };
}

function emptyService(): ServiceRowValue {
  return { description: '', costType: 'fixed', hours: '1', rate: '0', fixedAmount: '0' };
}

export function OrderForm({ mode, role, orderId, initialOrder }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isAdmin = role === 'admin';
  const headerFieldsEditable = mode === 'create' || isAdmin;

  const [vehicleId, setVehicleId] = useState<string | null>(initialOrder?.vehicle.id ?? null);
  const [vehicleText, setVehicleText] = useState<string>(
    initialOrder ? vehicleLabel(initialOrder.vehicle) : '',
  );
  const [clientId, setClientId] = useState<string | null>(initialOrder?.client.id ?? null);
  const [clientText, setClientText] = useState<string>(initialOrder?.client.name ?? '');
  const [deadline, setDeadline] = useState<Date | null>(
    initialOrder ? new Date(initialOrder.deadline) : (() => {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(d.getHours() + 1); return d;
    })(),
  );
  const [parts, setParts] = useState<PartRowValue[]>(
    initialOrder
      ? initialOrder.parts.map((p) => ({
          catalogPartId: p.catalogPartId,
          partName: p.name,
          qty: String(p.qty),
          unitPrice: String(p.unitPrice),
        }))
      : [],
  );
  const [services, setServices] = useState<ServiceRowValue[]>(
    initialOrder
      ? initialOrder.services.map((s) => ({
          description: s.description,
          costType: s.costType,
          hours: s.hours != null ? String(s.hours) : '',
          rate: s.rate != null ? String(s.rate) : '',
          fixedAmount: s.fixedAmount != null ? String(s.fixedAmount) : '',
        }))
      : [],
  );

  const [hourlyRate, setHourlyRate] = useState(30);
  const [showPartModal, setShowPartModal] = useState(false);
  const [pendingPartIndex, setPendingPartIndex] = useState<number | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<{ hourlyRate: number }>('/api/v1/settings')
      .then((res) => setHourlyRate(res.hourlyRate))
      .catch(() => {});
  }, []);

  const partsTotal = parts.reduce(
    (sum, p) => sum + (parseFloat(p.qty) || 0) * (parseFloat(p.unitPrice) || 0),
    0,
  );
  const servicesTotal = services.reduce((sum, s) => {
    if (s.costType === 'hourly') {
      return sum + (parseFloat(s.hours) || 0) * hourlyRate;
    }
    return sum + (parseFloat(s.fixedAmount) || 0);
  }, 0);
  const grand = partsTotal + servicesTotal;

  async function onVehicleSelect(item: { id: string; label: string }) {
    setVehicleId(item.id);
    setVehicleText(item.label);
    try {
      const res = await get<{ data: Vehicle }>(`/api/v1/catalog/vehicles/${item.id}`);
      const v = res.data;
      if (v.clientId && v.clientId !== UNKNOWN_CLIENT_ID) {
        const cr = await get<{ data: Client }>(`/api/v1/catalog/clients/${v.clientId}`);
        setClientId(cr.data.id);
        setClientText(cr.data.name);
      }
    } catch {
      // fail silent — user can still set client manually
    }
  }

  function validate(currentParts: PartRowValue[] = parts): string | null {
    if (!deadline) return 'Deadline is required';
    if (currentParts.length === 0 && services.length === 0)
      return 'Add at least one part or service';
    for (const p of currentParts) {
      if (!p.catalogPartId) return `Select a part for "${p.partName || 'each row'}"`;
      if (!(parseFloat(p.qty) > 0)) return 'Part quantity must be greater than 0';
      if (!(parseFloat(p.unitPrice) >= 0)) return 'Part unit price must be 0 or greater';
    }
    for (const s of services) {
      if (!s.description.trim()) return 'Service description is required';
      if (s.costType === 'hourly') {
        if (!(parseFloat(s.hours) > 0)) return 'Service hours must be greater than 0';
        if (!(hourlyRate >= 0)) return 'Hourly rate is not configured';
      } else {
        if (!(parseFloat(s.fixedAmount) >= 0)) return 'Fixed amount must be 0 or greater';
      }
    }
    return null;
  }

  function buildBody(
    finalVehicleId: string,
    finalClientId: string,
    currentParts: PartRowValue[] = parts,
  ): CreateOrderInput {
    return {
      vehicleId: finalVehicleId,
      clientId: finalClientId,
      deadline: deadline!.toISOString(),
      parts: currentParts.map((p) => ({
        catalogPartId: p.catalogPartId!,
        qty: parseFloat(p.qty),
        unitPrice: parseFloat(p.unitPrice),
      })),
      services: services.map((s) =>
        s.costType === 'hourly'
          ? {
              description: s.description.trim(),
              costType: 'hourly' as const,
              hours: parseFloat(s.hours),
              rate: hourlyRate,
              fixedAmount: null,
            }
          : {
              description: s.description.trim(),
              costType: 'fixed' as const,
              hours: null,
              rate: null,
              fixedAmount: parseFloat(s.fixedAmount),
            },
      ),
    };
  }

  async function doCreate(
    finalVehicleId: string,
    finalClientId: string,
    currentParts: PartRowValue[] = parts,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const body = buildBody(finalVehicleId, finalClientId, currentParts);
      const res = await post<{ data: OrderDetail }>('/api/v1/orders', body);
      toast.show('Order created', 'success');
      router.replace(`/orders/${res.data.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  function findFirstUnresolvedPart(currentParts: PartRowValue[] = parts): number {
    return currentParts.findIndex((p) => p.partName.trim() !== '' && !p.catalogPartId);
  }

  async function handleSubmitCreate(currentParts: PartRowValue[] = parts) {
    const unresolvedIdx = findFirstUnresolvedPart(currentParts);
    if (unresolvedIdx !== -1) {
      setPendingPartIndex(unresolvedIdx);
      setShowPartModal(true);
      return;
    }
    const err = validate(currentParts);
    if (err) {
      setError(err);
      return;
    }
    // Need a vehicle. If text provided but no id selected, open vehicle modal.
    if (!vehicleId && vehicleText.trim()) {
      setShowVehicleModal(true);
      return;
    }
    if (!vehicleId) {
      setError('Select or create a vehicle');
      return;
    }
    // Determine client
    if (!clientId && clientText.trim()) {
      setShowClientModal(true);
      return;
    }
    const finalClientId = clientId ?? UNKNOWN_CLIENT_ID;
    await doCreate(vehicleId, finalClientId, currentParts);
  }

  async function handleSubmitEdit(currentParts: PartRowValue[] = parts) {
    if (!orderId) return;
    const unresolvedIdx = findFirstUnresolvedPart(currentParts);
    if (unresolvedIdx !== -1) {
      setPendingPartIndex(unresolvedIdx);
      setShowPartModal(true);
      return;
    }
    const err = validate(currentParts);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: UpdateOrderInput = {
        parts: currentParts.map((p) => ({
          catalogPartId: p.catalogPartId!,
          qty: parseFloat(p.qty),
          unitPrice: parseFloat(p.unitPrice),
        })),
        services: services.map((s) =>
          s.costType === 'hourly'
            ? {
                description: s.description.trim(),
                costType: 'hourly' as const,
                hours: parseFloat(s.hours),
                rate: hourlyRate,
                fixedAmount: null,
              }
            : {
                description: s.description.trim(),
                costType: 'fixed' as const,
                hours: null,
                rate: null,
                fixedAmount: parseFloat(s.fixedAmount),
              },
        ),
      };
      if (headerFieldsEditable) {
        body.deadline = deadline!.toISOString();
        if (vehicleId) body.vehicleId = vehicleId;
        if (clientId) body.clientId = clientId;
      }
      await patch<{ data: OrderDetail }>(`/api/v1/orders/${orderId}`, body);
      toast.show('Order updated', 'success');
      router.replace(`/orders/${orderId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(currentParts: PartRowValue[] = parts) {
    if (mode === 'create') handleSubmitCreate(currentParts);
    else handleSubmitEdit(currentParts);
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, isTablet && { maxWidth: 720, alignSelf: 'center', width: '100%' }]}
      keyboardShouldPersistTaps="handled">
      <Section title="Vehicle & Client" theme={theme}>
        <View style={isTablet ? styles.row : undefined}>
          <View style={styles.flex}>
            <SearchableSelect
              label="Vehicle"
              value={vehicleText}
              onChangeText={(t) => {
                setVehicleText(t);
                setVehicleId(null);
                if (!t.trim()) {
                  setClientId(null);
                  setClientText('');
                }
              }}
              onSelect={onVehicleSelect}
              fetcher={searchVehicles}
              placeholder="Plate or description"
              disabled={!headerFieldsEditable}
            />
          </View>
          <View style={styles.flex}>
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
              placeholder="Client name (leave blank for Unknown)"
              disabled={!headerFieldsEditable}
            />
          </View>
        </View>
      </Section>

      <Section title="Deadline" theme={theme}>
        <DateTimeField value={deadline} onChange={setDeadline} disabled={!headerFieldsEditable} />
      </Section>

      <Section title="Parts" theme={theme}>
        <View style={{ gap: 8 }}>
          {parts.map((p, i) => (
            <PartRow
              key={i}
              value={p}
              onChange={(v) => setParts((prev) => prev.map((it, idx) => (idx === i ? v : it)))}
              onRemove={() => setParts((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Pressable
            onPress={() => setParts((p) => [...p, emptyPart()])}
            style={[styles.addBtn, { borderColor: theme.border }]}>
            <Text style={[styles.addBtnText, { color: theme.textSecondary }]}>+ Add part</Text>
          </Pressable>
        </View>
        <Text style={[styles.subtotal, { color: theme.textMuted }]}>
          Subtotal {formatCurrency(partsTotal)}
        </Text>
      </Section>

      <Section title="Services" theme={theme}>
        <View style={{ gap: 8 }}>
          {services.map((s, i) => (
            <ServiceRow
              key={i}
              value={s}
              hourlyRate={hourlyRate}
              onChange={(v) => setServices((prev) => prev.map((it, idx) => (idx === i ? v : it)))}
              onRemove={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Pressable
            onPress={() => setServices((s) => [...s, emptyService()])}
            style={[styles.addBtn, { borderColor: theme.border }]}>
            <Text style={[styles.addBtnText, { color: theme.textSecondary }]}>+ Add service</Text>
          </Pressable>
        </View>
        <Text style={[styles.subtotal, { color: theme.textMuted }]}>
          Subtotal {formatCurrency(servicesTotal)}
        </Text>
      </Section>

      <View
        style={[
          styles.grandBox,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <Text style={[styles.grandLabel, { color: theme.textMuted }]}>Total</Text>
        <Text style={[styles.grandValue, { color: theme.text }]}>{formatCurrency(grand)}</Text>
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      <Pressable
        onPress={() => handleSubmit()}
        disabled={submitting}
        style={[styles.submit, { backgroundColor: theme.accent, opacity: submitting ? 0.6 : 1 }]}>
        {submitting ? (
          <ActivityIndicator color={theme.accentText} />
        ) : (
          <Text style={[styles.submitText, { color: theme.accentText }]}>
            {mode === 'create' ? 'Create Order' : 'Save Changes'}
          </Text>
        )}
      </Pressable>

      <PartModal
        visible={showPartModal}
        initialName={pendingPartIndex !== null ? (parts[pendingPartIndex]?.partName ?? '') : ''}
        onClose={() => { setShowPartModal(false); setPendingPartIndex(null); }}
        onCreated={(part: Part) => {
          const idx = pendingPartIndex;
          setShowPartModal(false);
          setPendingPartIndex(null);
          if (idx === null) return;
          const updatedParts = parts.map((p, i) =>
            i === idx ? { ...p, catalogPartId: part.id, partName: part.name } : p,
          );
          setParts(updatedParts);
          handleSubmit(updatedParts);
        }}
      />
      <VehicleModal
        visible={showVehicleModal}
        initialDescription={vehicleText}
        initialClient={clientId ? { id: clientId, name: clientText } : null}
        onClose={() => setShowVehicleModal(false)}
        onCreated={async (v) => {
          setShowVehicleModal(false);
          setVehicleId(v.id);
          setVehicleText(vehicleLabel(v));
          let resolvedClientId = clientId;
          let resolvedClientText = clientText;
          if (v.clientId && v.clientId !== UNKNOWN_CLIENT_ID) {
            try {
              const cr = await get<{ data: Client }>(`/api/v1/catalog/clients/${v.clientId}`);
              setClientId(cr.data.id);
              setClientText(cr.data.name);
              resolvedClientId = cr.data.id;
              resolvedClientText = cr.data.name;
            } catch {
              // ignore
            }
          }
          if (!resolvedClientId && resolvedClientText.trim()) {
            setShowClientModal(true);
            return;
          }
          await doCreate(v.id, resolvedClientId ?? UNKNOWN_CLIENT_ID);
        }}
      />
      <ClientModal
        visible={showClientModal}
        initialName={clientText}
        onClose={() => setShowClientModal(false)}
        onCreated={(c) => {
          setShowClientModal(false);
          setClientId(c.id);
          setClientText(c.name);
          if (vehicleId) doCreate(vehicleId, c.id);
        }}
      />
    </ScrollView>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: { textMuted: string };
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 16,
    paddingBottom: 60,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  addBtn: {
    height: 36,
    borderRadius: 8,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 12, fontWeight: '500' },
  subtotal: { fontSize: 11, textAlign: 'right' },
  grandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  grandLabel: { fontSize: 12 },
  grandValue: { fontSize: 16, fontWeight: '500' },
  error: { fontSize: 12 },
  submit: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 13, fontWeight: '500' },
});
