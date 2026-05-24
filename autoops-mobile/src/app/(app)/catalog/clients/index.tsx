import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { ClientModal } from '@/components/catalog/ClientModal';
import { RowActions } from '@/components/catalog/RowActions';
import { confirmAlert } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, del } from '@/lib/api';
import { UNKNOWN_CLIENT_ID } from '@/lib/constants';
import type { Client } from '@/lib/types';

export default function ClientsListScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { role } = useSession();
  const isAdmin = role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleDelete(client: Client) {
    const ok = await confirmAlert({
      title: `Delete ${client.name}?`,
      message: 'This client and their reference in any future vehicle assignments will be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await del<{ data: { id: string } }>(`/api/v1/catalog/clients/${client.id}`);
      toast.show('Client deleted', 'success');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Delete failed', 'error');
    }
  }

  return (
    <View style={styles.container}>
      <CatalogList<Client>
        endpoint="/api/v1/catalog/clients"
        searchPlaceholder="Search clients"
        emptyMessage="No clients yet — add one during order creation or tap + Add client"
        ctaLabel="+ Add client"
        onCta={() => setShowCreate(true)}
        refreshKey={refreshKey}
        renderItem={(c) => {
          const isUnknown = c.id === UNKNOWN_CLIENT_ID;
          return (
            <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                  {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              {isAdmin && !isUnknown ? (
                <RowActions
                  onEdit={() => router.push(`/catalog/clients/${c.id}/edit`)}
                  onDelete={() => handleDelete(c)}
                />
              ) : null}
            </View>
          );
        }}
      />
      <ClientModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          toast.show('Client added', 'success');
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
  meta: { fontSize: 13, marginTop: 4 },
});
