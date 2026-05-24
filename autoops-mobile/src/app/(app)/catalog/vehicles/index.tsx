import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogList } from '@/components/catalog/CatalogList';
import { useCatalogCtaRegister } from '@/components/catalog/CatalogCtaContext';
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

  useCatalogCtaRegister('+ Add vehicle', () => setShowCreate(true));

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
        renderItem={(v, { isTablet }) => {
          const makeModel = [v.make, v.model, v.year].filter(Boolean).join(' ');
          const isUnknown = v.clientId === UNKNOWN_CLIENT_ID;
          return (
            <View
              style={[
                isTablet ? styles.cardRow : styles.flatRow,
                { borderColor: isTablet ? theme.border : 'rgba(255,255,255,0.05)', backgroundColor: isTablet ? theme.backgroundElement : 'transparent' },
              ]}>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {vehicleLabel(v)}
                </Text>
                <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
                  {makeModel || '—'}
                </Text>
                {isUnknown ? (
                  <Text style={[styles.meta, { color: theme.textMuted }]}>Unknown client</Text>
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
