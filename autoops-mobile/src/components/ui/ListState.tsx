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
        <ActivityIndicator color={theme.textSecondary} />
      ) : (
        <Text style={[styles.message, { color: theme.textMuted }]}>
          {message ?? (state === 'empty' ? 'Nothing here yet' : 'Something went wrong')}
        </Text>
      )}
      {state !== 'loading' && ctaLabel && onCta ? (
        <Pressable onPress={onCta} style={[styles.cta, { backgroundColor: theme.accent }]}>
          <Text style={[styles.ctaText, { color: theme.accentText }]}>{ctaLabel}</Text>
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
    padding: 24,
    gap: 12,
  },
  message: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ctaText: {
    fontWeight: '500',
    fontSize: 12,
  },
});
