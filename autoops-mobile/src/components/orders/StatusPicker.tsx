import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { statusLabel } from '@/components/ui/StatusBadge';
import type { OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['booked', 'in_progress', 'awaiting', 'payment', 'done'];

type Props = {
  visible: boolean;
  current: OrderStatus;
  onSelect: (s: OrderStatus) => void;
  onClose: () => void;
};

export function StatusPicker({ visible, current, onSelect, onClose }: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.text }]}>Change status</Text>
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => onSelect(s)}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: pressed ? theme.backgroundElement : 'transparent' },
              ]}>
              <Text style={[styles.optionText, { color: theme.text }]}>{statusLabel(s)}</Text>
              {current === s ? <Text style={[styles.check, { color: theme.text }]}>✓</Text> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: { fontSize: 16 },
  check: { fontSize: 16, fontWeight: '500' },
});
