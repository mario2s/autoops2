import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  state: 'loading' | 'empty' | 'error';
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function ListState({ state, message, ctaLabel, onCta }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {state === 'loading' ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message ?? (state === 'empty' ? 'Nothing here yet' : 'Something went wrong')}</Text>
      )}
      {state !== 'loading' && ctaLabel && onCta ? (
        <Pressable onPress={onCta} style={[styles.cta, { backgroundColor: '#208AEF' }]}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
