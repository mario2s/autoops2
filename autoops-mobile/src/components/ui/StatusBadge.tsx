import { StyleSheet, Text, View } from 'react-native';

import type { OrderStatus } from '@/lib/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  booked: 'Booked',
  in_progress: 'In progress',
  awaiting: 'Awaiting',
  payment: 'Payment',
  done: 'Done',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  booked: { bg: '#E0E7FF', fg: '#3730A3' },
  in_progress: { bg: '#FEF3C7', fg: '#92400E' },
  awaiting: { bg: '#FCE7F3', fg: '#9D174D' },
  payment: { bg: '#DBEAFE', fg: '#1E40AF' },
  done: { bg: '#D1FAE5', fg: '#065F46' },
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

type Props = {
  status: OrderStatus;
  size?: 'sm' | 'md';
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = STATUS_COLORS[status];
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
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
});
