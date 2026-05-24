import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/orders/OrderCard';
import { ListState } from '@/components/ui/ListState';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get } from '@/lib/api';
import type { OrderListItem, OrderStatus, Paginated } from '@/lib/types';

type Filter = OrderStatus | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'booked', label: statusLabel('booked') },
  { id: 'in_progress', label: statusLabel('in_progress') },
  { id: 'awaiting', label: statusLabel('awaiting') },
  { id: 'payment', label: statusLabel('payment') },
  { id: 'done', label: statusLabel('done') },
  { id: 'all', label: 'All' },
];

const PAGE_SIZE = 20;

export default function OrdersListScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<Filter>('in_progress');
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { page: number; reset: boolean; filter: Filter }) => {
      if (opts.reset) {
        setLoading(opts.page === 1 && items.length === 0);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        if (opts.filter !== 'all') params.set('status', opts.filter);
        params.set('page', String(opts.page));
        params.set('pageSize', String(PAGE_SIZE));
        const res = await get<Paginated<OrderListItem>>(`/api/v1/orders?${params}`);
        setTotal(res.pagination.total);
        setPage(opts.page);
        setItems((prev) => (opts.reset ? res.data : [...prev, ...res.data]));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [items.length],
  );

  useEffect(() => {
    load({ page: 1, reset: true, filter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load({ page: 1, reset: true, filter });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]),
  );

  function onRefresh() {
    setRefreshing(true);
    load({ page: 1, reset: true, filter });
  }

  function onEndReached() {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    load({ page: page + 1, reset: false, filter });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Orders</Text>
        <Pressable
          onPress={() => router.push('/orders/new')}
          style={[styles.newBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.newBtnText, { color: theme.accentText }]}>+ New</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pills}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderColor: active ? 'rgba(255,255,255,0.25)' : theme.borderStrong,
                },
              ]}>
              <Text
                style={[
                  styles.pillText,
                  { color: active ? theme.text : theme.textSecondary },
                ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ListState state="loading" />
      ) : error ? (
        <ListState state="error" message={error} ctaLabel="Retry" onCta={() => load({ page: 1, reset: true, filter })} />
      ) : items.length === 0 ? (
        <ListState
          state="empty"
          message="No orders found — tap + New to create one"
          ctaLabel="+ New order"
          onCta={() => router.push('/orders/new')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 16, fontWeight: '500' },
  newBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  newBtnText: { fontWeight: '500', fontSize: 12 },
  pillsScroll: { flexGrow: 0, flexShrink: 0 },
  pills: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  pillText: { fontSize: 10, fontWeight: '500' },
  list: { padding: 12 },
});
