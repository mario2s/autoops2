import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPicker } from '@/components/orders/StatusPicker';
import { ListState } from '@/components/ui/ListState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get, patch } from '@/lib/api';
import { formatCurrency, formatDateTime, isOverdue, vehicleLabel } from '@/lib/format';
import type { OrderDetail, OrderStatus } from '@/lib/types';

export default function OrderDetailScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, role } = useSession();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await get<{ data: OrderDetail }>(`/api/v1/orders/${id}`);
      setOrder(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(s: OrderStatus) {
    if (!order || updating) return;
    setShowStatus(false);
    setUpdating(true);
    try {
      const res = await patch<{ data: OrderDetail }>(`/api/v1/orders/${order.id}`, { status: s });
      setOrder(res.data);
      toast.show('Status updated', 'success');
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ListState state="loading" />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ListState state="error" message={error ?? 'Order not found'} ctaLabel="Retry" onCta={load} />
      </SafeAreaView>
    );
  }

  const canEdit = role === 'admin' || order.mechanic.id === userId;
  const overdue = isOverdue(order.deadline);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.text }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {vehicleLabel(order.vehicle)}
        </Text>
        {canEdit ? (
          <Pressable onPress={() => router.push(`/orders/${order.id}/edit`)} style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <View style={styles.editBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusRow, { backgroundColor: theme.backgroundElement }]}>
          <StatusBadge status={order.status} />
          <Pressable onPress={() => setShowStatus(true)} disabled={updating} style={styles.changeBtn}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>

        <Section title="Vehicle" theme={theme}>
          <Field k="Plate / description" v={vehicleLabel(order.vehicle)} theme={theme} />
          <Field k="Make" v={order.vehicle.make ?? '—'} theme={theme} />
          <Field k="Model" v={order.vehicle.model ?? '—'} theme={theme} />
          <Field k="Year" v={order.vehicle.year ? String(order.vehicle.year) : '—'} theme={theme} />
        </Section>

        <Section title="Client" theme={theme}>
          <Field k="Name" v={order.client.name} theme={theme} />
          <Field k="Phone" v={order.client.phone ?? '—'} theme={theme} />
          <Field k="Email" v={order.client.email ?? '—'} theme={theme} />
        </Section>

        <Section title="Deadline" theme={theme}>
          <Text style={[styles.deadline, { color: overdue ? '#DC2626' : theme.text }]}>
            {formatDateTime(order.deadline)}
            {overdue ? '  (overdue)' : ''}
          </Text>
        </Section>

        <Section title="Parts" theme={theme}>
          {order.parts.length === 0 ? (
            <Text style={[styles.dim, { color: theme.textSecondary }]}>No parts</Text>
          ) : (
            <View>
              <View style={styles.tableHead}>
                <Text style={[styles.colName, styles.headText, { color: theme.textSecondary }]}>Name</Text>
                <Text style={[styles.colNum, styles.headText, { color: theme.textSecondary }]}>Qty</Text>
                <Text style={[styles.colNum, styles.headText, { color: theme.textSecondary }]}>Unit</Text>
                <Text style={[styles.colNum, styles.headText, { color: theme.textSecondary }]}>Total</Text>
              </View>
              {order.parts.map((p) => (
                <View key={p.id} style={styles.tableRow}>
                  <Text style={[styles.colName, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.colNum, { color: theme.text }]}>{p.qty}</Text>
                  <Text style={[styles.colNum, { color: theme.text }]}>{formatCurrency(p.unitPrice)}</Text>
                  <Text style={[styles.colNum, { color: theme.text }]}>{formatCurrency(p.total)}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.subtotal, { color: theme.textSecondary }]}>
            Parts subtotal: {formatCurrency(order.totals.parts)}
          </Text>
        </Section>

        <Section title="Services" theme={theme}>
          {order.services.length === 0 ? (
            <Text style={[styles.dim, { color: theme.textSecondary }]}>No services</Text>
          ) : (
            order.services.map((s) => (
              <View key={s.id} style={[styles.serviceRow, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.serviceDesc, { color: theme.text }]}>{s.description}</Text>
                <Text style={[styles.serviceMeta, { color: theme.textSecondary }]}>
                  {s.costType === 'hourly'
                    ? `${s.hours} h × ${formatCurrency(s.rate ?? 0)}`
                    : 'Fixed'}
                </Text>
                <Text style={[styles.serviceTotal, { color: theme.text }]}>
                  {formatCurrency(s.total)}
                </Text>
              </View>
            ))
          )}
          <Text style={[styles.subtotal, { color: theme.textSecondary }]}>
            Services subtotal: {formatCurrency(order.totals.services)}
          </Text>
        </Section>

        <View style={[styles.grandBox, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.grandLabel, { color: theme.textSecondary }]}>Grand total</Text>
          <Text style={[styles.grandValue, { color: theme.text }]}>{formatCurrency(order.totals.grand)}</Text>
        </View>
      </ScrollView>

      <StatusPicker
        visible={showStatus}
        current={order.status}
        onSelect={changeStatus}
        onClose={() => setShowStatus(false)}
      />
    </SafeAreaView>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: { text: string } }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ k, v, theme }: { k: string; v: string; theme: { text: string; textSecondary: string } }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldKey, { color: theme.textSecondary }]}>{k}</Text>
      <Text style={[styles.fieldVal, { color: theme.text }]}>{v}</Text>
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
    gap: 8,
  },
  backBtn: { padding: 6, minWidth: 60 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  editText: { color: '#208AEF', fontSize: 15, fontWeight: '600' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  changeText: { color: '#208AEF', fontWeight: '600', fontSize: 14 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  field: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fieldKey: { fontSize: 14 },
  fieldVal: { fontSize: 14, fontWeight: '500' },
  deadline: { fontSize: 15, fontWeight: '500' },
  dim: { fontSize: 14 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headText: { fontSize: 12, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  colName: { flex: 2, fontSize: 14 },
  colNum: { flex: 1, fontSize: 14, textAlign: 'right' },
  serviceRow: {
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  serviceDesc: { flex: 1, fontSize: 14, fontWeight: '500' },
  serviceMeta: { fontSize: 12 },
  serviceTotal: { fontSize: 14, fontWeight: '600' },
  subtotal: { fontSize: 13, textAlign: 'right', marginTop: 6 },
  grandBox: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandLabel: { fontSize: 14, fontWeight: '500' },
  grandValue: { fontSize: 24, fontWeight: '700' },
});
