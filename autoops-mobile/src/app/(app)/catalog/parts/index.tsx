import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { useCatalogCtaRegister } from '@/components/catalog/CatalogCtaContext';
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

  useCatalogCtaRegister('+ Add part', () => setShowCreate(true));

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
        renderItem={(part, { isTablet }) => (
          <View
            style={[
              isTablet ? styles.cardRow : styles.flatRow,
              { borderColor: isTablet ? theme.border : 'rgba(255,255,255,0.05)', backgroundColor: isTablet ? theme.backgroundElement : 'transparent' },
            ]}>
            <View style={styles.flex}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {part.name}
              </Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
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
  flatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 8,
  },
  flex: { flex: 1 },
  name: { fontSize: 11, fontWeight: '500' },
  meta: { fontSize: 9, marginTop: 1 },
});
