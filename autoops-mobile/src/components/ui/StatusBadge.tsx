import { StyleSheet, Text, View } from 'react-native';

import { StatusPalette } from '@/constants/theme';
import type { OrderStatus } from '@/lib/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  booked: 'Booked',
  in_progress: 'In progress',
  awaiting: 'Awaiting',
  payment: 'Payment',
  done: 'Done',
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

type Props = {
  status: OrderStatus;
  size?: 'sm' | 'md';
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = StatusPalette[status];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.badgeSm,
      ]}>
      <Text style={[styles.text, { color: colors.fg }, size === 'sm' && styles.textSm]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  textSm: {
    fontSize: 11,
  },
});
