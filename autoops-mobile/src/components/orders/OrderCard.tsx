import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatDate, isOverdue, vehicleLabel } from '@/lib/format';
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
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={[styles.primary, { color: theme.text }]} numberOfLines={1}>
            {vehicleLabel(order.vehicle)}
          </Text>
          <Text style={[styles.secondary, { color: theme.textSecondary }]} numberOfLines={1}>
            {order.client.name}
          </Text>
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>
      <View style={styles.row}>
        <Text style={[styles.deadline, { color: overdue ? '#DC2626' : theme.textSecondary }]}>
          {formatDate(order.deadline)}
        </Text>
        <Text style={[styles.total, { color: theme.text }]}>
          {formatCurrency(order.totals.grand)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flex: { flex: 1 },
  primary: { fontSize: 16, fontWeight: '600' },
  secondary: { fontSize: 13, marginTop: 2 },
  deadline: { fontSize: 13, fontWeight: '500' },
  total: { fontSize: 15, fontWeight: '600' },
});
