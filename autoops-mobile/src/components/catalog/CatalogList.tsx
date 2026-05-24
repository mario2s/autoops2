import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { ListState } from '@/components/ui/ListState';
import { SearchInput } from '@/components/ui/SearchInput';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, get } from '@/lib/api';
import type { Paginated } from '@/lib/types';

type Props<T extends { id: string }> = {
  endpoint: string;
  renderItem: (item: T, opts: { isTablet: boolean }) => React.ReactNode;
  searchPlaceholder: string;
  emptyMessage: string;
  ctaLabel: string;
  onCta: (searchTerm: string) => void;
  refreshKey?: number;
};

const PAGE_SIZE = 20;

export function CatalogList<T extends { id: string }>({
  endpoint,
  renderItem,
  searchPlaceholder,
  emptyMessage,
  ctaLabel,
  onCta,
  refreshKey,
}: Props<T>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [searchText, setSearchText] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { page: number; reset: boolean; term: string }) => {
      if (opts.reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        if (opts.term) params.set('search', opts.term);
        params.set('page', String(opts.page));
        params.set('pageSize', String(PAGE_SIZE));
        const res = await get<Paginated<T>>(`${endpoint}?${params}`);
        setTotal(res.pagination.total);
        setPage(opts.page);
        setItems((prev) => {
          if (opts.reset) return res.data;
          const seen = new Set(prev.map((i) => i.id));
          return [...prev, ...res.data.filter((i) => !seen.has(i.id))];
        });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [endpoint],
  );

  useEffect(() => {
    load({ page: 1, reset: true, term: debouncedTerm });
  }, [debouncedTerm, refreshKey, load]);

  function onRefresh() {
    setRefreshing(true);
    load({ page: 1, reset: true, term: debouncedTerm });
  }

  function onEndReached() {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    load({ page: page + 1, reset: false, term: debouncedTerm });
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <SearchInput
          value={searchText}
          onChangeText={setSearchText}
          onDebouncedChange={setDebouncedTerm}
          placeholder={searchPlaceholder}
        />
      </View>

      {loading ? (
        <ListState state="loading" />
      ) : error ? (
        <ListState state="error" message={error} ctaLabel="Retry" onCta={() => load({ page: 1, reset: true, term: debouncedTerm })} />
      ) : items.length === 0 ? (
        <ListState state="empty" message={emptyMessage} ctaLabel={ctaLabel} onCta={() => onCta(searchText)} />
      ) : (
        <FlatList
          data={items}
          key={isTablet ? 'two' : 'one'}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? { gap: 10 } : undefined}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={isTablet ? { flex: 1 } : undefined}>{renderItem(item, { isTablet })}</View>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={
            isTablet ? () => <View style={{ height: 10 }} /> : undefined
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 16 },
});
