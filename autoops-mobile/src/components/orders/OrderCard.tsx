import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, isOverdue, vehicleLabel } from '@/lib/format';
import type { OrderListItem } from '@/lib/types';

type Props = {
  order: OrderListItem;
  onPress: () => void;
};

export function OrderCard({ order, onPress }: Props) {
  const theme = useTheme();
  const overdue = isOverdue(order.deadline);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={[styles.primary, { color: theme.text }]} numberOfLines={1}>
            {vehicleLabel(order.vehicle)}
          </Text>
          <Text style={[styles.secondary, { color: theme.textMuted }]} numberOfLines={1}>
            {order.client.name}
          </Text>
        </View>
        <Text style={[styles.total, { color: theme.textSecondary }]}>
          ${Math.round(order.totals.grand ?? 0)}
        </Text>
      </View>
      <View style={styles.row}>
        <StatusBadge status={order.status} size="sm" />
        <Text style={[styles.deadline, { color: overdue ? theme.overdue : theme.textMuted }]}>
          {formatDate(order.deadline)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flex: { flex: 1 },
  primary: { fontSize: 12, fontWeight: '500' },
  secondary: { fontSize: 10, marginTop: 1 },
  deadline: { fontSize: 10 },
  total: { fontSize: 11 },
});
