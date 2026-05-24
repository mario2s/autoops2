import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onDebouncedChange?: (text: string) => void;
  debounceMs?: number;
  minChars?: number;
  autoFocus?: boolean;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
  onDebouncedChange,
  debounceMs = 300,
  minChars = 2,
  autoFocus,
}: Props) {
  const theme = useTheme();
  const [internal, setInternal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  function handleChange(text: string) {
    setInternal(text);
    onChangeText(text);
    if (!onDebouncedChange) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (text.length === 0 || text.length >= minChars) {
        onDebouncedChange(text);
      }
    }, debounceMs);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <TextInput
        value={internal}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoFocus={autoFocus}
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: {
    height: 44,
    fontSize: 16,
  },
});
