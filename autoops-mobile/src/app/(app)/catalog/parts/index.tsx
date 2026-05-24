import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { PartModal } from '@/components/catalog/PartModal';
import { RowActions } from '@/components/catalog/RowActions';
import { confirmAlert } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, del } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Part } from '@/lib/types';

export default function PartsListScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { role } = useSession();
  const isAdmin = role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleDelete(part: Part) {
    const ok = await confirmAlert({
      title: `Delete ${part.name}?`,
      message:
        'Deleting this part affects which parts users can pick going forward. Historical orders are preserved.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await del<{ data: { id: string } }>(`/api/v1/catalog/parts/${part.id}`);
      toast.show('Part deleted', 'success');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Delete failed', 'error');
    }
  }

  return (
    <View style={styles.container}>
      <CatalogList<Part>
        endpoint="/api/v1/catalog/parts"
        searchPlaceholder="Search parts"
        emptyMessage="No parts in catalog — tap + Add part to get started"
        ctaLabel="+ Add part"
        onCta={() => setShowCreate(true)}
        refreshKey={refreshKey}
        renderItem={(part) => (
          <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.flex}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {part.name}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                Added {formatDate(part.createdAt)}
              </Text>
            </View>
            {isAdmin ? (
              <RowActions
                onEdit={() => router.push(`/catalog/parts/${part.id}/edit`)}
                onDelete={() => handleDelete(part)}
              />
            ) : null}
          </View>
        )}
      />
      <PartModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          toast.show('Part added', 'success');
          setRefreshKey((k) => k + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 4 },
});
