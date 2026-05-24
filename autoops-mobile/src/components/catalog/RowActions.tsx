import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

export function RowActions({ onEdit, onDelete }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.btn} hitSlop={10}>
        <Text style={[styles.btnText, { color: theme.textSecondary }]}>⋯</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.menu, { backgroundColor: theme.background }]}
            onPress={(e) => e.stopPropagation()}>
            <Pressable
              onPress={() => {
                setOpen(false);
                onEdit();
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}>
              <Text style={[styles.itemText, { color: theme.text }]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setOpen(false);
                onDelete();
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}>
              <Text style={[styles.itemText, { color: '#DC2626' }]}>Delete</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 22, lineHeight: 22, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    minWidth: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: 16, paddingVertical: 14 },
  itemText: { fontSize: 16, fontWeight: '500' },
});
