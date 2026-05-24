import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Options = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function confirmAlert(opts: Options): Promise<boolean> {
  if (Platform.OS !== 'web') {
    return new Promise((resolve) => {
      Alert.alert(
        opts.title,
        opts.message,
        [
          { text: opts.cancelLabel ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: opts.confirmLabel ?? 'OK',
            style: opts.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }
  // web fallback uses native confirm
  return Promise.resolve(window.confirm(`${opts.title}${opts.message ? `\n\n${opts.message}` : ''}`));
}

type DialogProps = Options & {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: DialogProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.btn}>
              <Text style={[styles.btnText, { color: theme.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.btn}>
              <Text style={[styles.btnText, { color: destructive ? '#DC2626' : '#208AEF' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
