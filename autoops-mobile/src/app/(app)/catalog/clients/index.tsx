import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { useCatalogCtaRegister } from '@/components/catalog/CatalogCtaContext';
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

  useCatalogCtaRegister('+ Add client', () => setShowCreate(true));

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
        renderItem={(c, { isTablet }) => {
          const isUnknown = c.id === UNKNOWN_CLIENT_ID;
          return (
            <View
              style={[
                isTablet ? styles.cardRow : styles.flatRow,
                { borderColor: isTablet ? theme.border : 'rgba(255,255,255,0.05)', backgroundColor: isTablet ? theme.backgroundElement : 'transparent' },
              ]}>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
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
