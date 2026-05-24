import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { RowActions } from '@/components/catalog/RowActions';
import { VehicleModal } from '@/components/catalog/VehicleModal';
import { confirmAlert } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, del } from '@/lib/api';
import { UNKNOWN_CLIENT_ID } from '@/lib/constants';
import { vehicleLabel } from '@/lib/format';
import type { Vehicle } from '@/lib/types';

export default function VehiclesListScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { role } = useSession();
  const isAdmin = role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleDelete(vehicle: Vehicle) {
    const ok = await confirmAlert({
      title: `Delete ${vehicleLabel(vehicle)}?`,
      message: 'This will remove the vehicle. Historical orders are preserved.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await del<{ data: { id: string } }>(`/api/v1/catalog/vehicles/${vehicle.id}`);
      toast.show('Vehicle deleted', 'success');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Delete failed', 'error');
    }
  }

  return (
    <View style={styles.container}>
      <CatalogList<Vehicle>
        endpoint="/api/v1/catalog/vehicles"
        searchPlaceholder="Search by plate or description"
        emptyMessage="No vehicles yet — add one during order creation or tap + Add vehicle"
        ctaLabel="+ Add vehicle"
        onCta={() => setShowCreate(true)}
        refreshKey={refreshKey}
        renderItem={(v) => {
          const makeModel = [v.make, v.model, v.year].filter(Boolean).join(' ');
          const isUnknown = v.clientId === UNKNOWN_CLIENT_ID;
          return (
            <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {vehicleLabel(v)}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                  {makeModel || '—'}
                </Text>
                {isUnknown ? (
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>Unknown client</Text>
                ) : null}
              </View>
              {isAdmin ? (
                <RowActions
                  onEdit={() => router.push(`/catalog/vehicles/${v.id}/edit`)}
                  onDelete={() => handleDelete(v)}
                />
              ) : null}
            </View>
          );
        }}
      />
      <VehicleModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          toast.show('Vehicle added', 'success');
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
