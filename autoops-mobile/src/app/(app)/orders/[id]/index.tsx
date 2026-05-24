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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Text style={[styles.backText, { color: theme.textSecondary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {vehicleLabel(order.vehicle)}
        </Text>
        {canEdit ? (
          <Pressable
            onPress={() => router.push(`/orders/${order.id}/edit`)}
            style={[styles.editBtn, { borderColor: theme.borderStrong }]}>
            <Text style={[styles.editText, { color: theme.textSecondary }]}>Edit</Text>
          </Pressable>
        ) : (
          <View style={styles.editBtnGhost} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <StatusBadge status={order.status} />
          <Pressable
            onPress={() => setShowStatus(true)}
            disabled={updating}
            style={[styles.changeBtn, { borderColor: theme.border }]}>
            <Text style={[styles.changeText, { color: theme.textMuted }]}>Change status</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Vehicle & Client</Text>
        <Field k="Plate / description" v={vehicleLabel(order.vehicle)} theme={theme} />
        <Field k="Make" v={order.vehicle.make ?? '—'} theme={theme} />
        <Field k="Model" v={order.vehicle.model ?? '—'} theme={theme} />
        <Field k="Year" v={order.vehicle.year ? String(order.vehicle.year) : '—'} theme={theme} />
        <Field k="Client" v={order.client.name} theme={theme} />
        <Field k="Phone" v={order.client.phone ?? '—'} theme={theme} />
        <Field k="Email" v={order.client.email ?? '—'} theme={theme} />
        <Field
          k="Deadline"
          v={`${formatDateTime(order.deadline)}${overdue ? ' — overdue' : ''}`}
          theme={theme}
          danger={overdue}
        />

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Parts</Text>
        {order.parts.length === 0 ? (
          <Text style={[styles.dim, { color: theme.textMuted }]}>No parts</Text>
        ) : (
          <View>
            {order.parts.map((p) => (
              <View key={p.id} style={[styles.lineRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={[styles.lineName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={[styles.lineQty, { color: theme.textMuted }]}>×{p.qty}</Text>
                <Text style={[styles.lineTotal, { color: theme.textMuted }]}>
                  {formatCurrency(p.total)}
                </Text>
              </View>
            ))}
            <Text style={[styles.subtotal, { color: theme.textMuted }]}>
              Subtotal {formatCurrency(order.totals.parts)}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Services</Text>
        {order.services.length === 0 ? (
          <Text style={[styles.dim, { color: theme.textMuted }]}>No services</Text>
        ) : (
          <View>
            {order.services.map((s) => (
              <View key={s.id} style={[styles.lineRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={[styles.lineName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {s.description}
                </Text>
                <Text style={[styles.lineQty, { color: theme.textMuted }]}>
                  {s.costType === 'hourly' ? `${s.hours}h` : 'Fixed'}
                </Text>
                <Text style={[styles.lineTotal, { color: theme.textMuted }]}>
                  {formatCurrency(s.total)}
                </Text>
              </View>
            ))}
            <Text style={[styles.subtotal, { color: theme.textMuted }]}>
              Subtotal {formatCurrency(order.totals.services)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.grandBox,
            { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: theme.border },
          ]}>
          <Text style={[styles.grandLabel, { color: theme.textMuted }]}>Grand total</Text>
          <Text style={[styles.grandValue, { color: theme.text }]}>
            {formatCurrency(order.totals.grand)}
          </Text>
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

function Field({
  k,
  v,
  theme,
  danger,
}: {
  k: string;
  v: string;
  theme: { text: string; textMuted: string; textSecondary: string; border: string; overdue: string };
  danger?: boolean;
}) {
  return (
    <View style={[styles.field, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
      <Text style={[styles.fieldKey, { color: theme.textMuted }]}>{k}</Text>
      <Text style={[styles.fieldVal, { color: danger ? theme.overdue : theme.textSecondary }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  iconBtn: { width: 28, alignItems: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 20, fontWeight: '400', lineHeight: 22 },
  title: { flex: 1, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  editBtnGhost: { width: 44 },
  editText: { fontSize: 11, fontWeight: '500' },
  content: { paddingBottom: 32 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  changeText: { fontSize: 11, fontWeight: '500' },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
  },
  fieldKey: { fontSize: 10 },
  fieldVal: { fontSize: 10, fontWeight: '400' },
  dim: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 5 },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  lineName: { flex: 1, fontSize: 11 },
  lineQty: { fontSize: 10, width: 46, textAlign: 'right' },
  lineTotal: { fontSize: 10, width: 56, textAlign: 'right' },
  subtotal: { fontSize: 10, textAlign: 'right', paddingHorizontal: 10, paddingTop: 5 },
  grandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  grandLabel: { fontSize: 12 },
  grandValue: { fontSize: 15, fontWeight: '500' },
});
