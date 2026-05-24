import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderForm } from '@/components/orders/OrderForm';
import { ListState } from '@/components/ui/ListState';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get } from '@/lib/api';
import type { OrderDetail } from '@/lib/types';

export default function EditOrderScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, userId } = useSession();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await get<{ data: OrderDetail }>(`/api/v1/orders/${id}`);
        setOrder(res.data);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Permission check: mechanic can only edit own orders
  useEffect(() => {
    if (!order || !role || !userId) return;
    if (role !== 'admin' && order.mechanic.id !== userId) {
      router.replace('/orders');
    }
  }, [order, role, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.text }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit order</Text>
        <View style={styles.spacer} />
      </View>
      {loading ? (
        <ListState state="loading" />
      ) : error || !order ? (
        <ListState state="error" message={error ?? 'Order not found'} />
      ) : (
        <OrderForm mode="edit" role={role} orderId={order.id} initialOrder={order} />
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
});
