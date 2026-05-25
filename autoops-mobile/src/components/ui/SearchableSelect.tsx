import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Item = { id: string; label: string; sublabel?: string };

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: Item) => void;
  fetcher: (q: string) => Promise<Item[]>;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
  minChars?: number;
  fieldStyle?: ViewStyle;
};

export function SearchableSelect({
  label,
  value,
  onChangeText,
  onSelect,
  fetcher,
  placeholder = 'Search…',
  disabled,
  debounceMs = 300,
  minChars = 2,
  fieldStyle,
}: Props) {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef<string>('');

  function handleText(text: string) {
    onChangeText(text);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (text.length < minChars) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      lastQuery.current = text;
      setLoading(true);
      try {
        const result = await fetcher(text);
        if (lastQuery.current === text) setItems(result);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <View>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: theme.backgroundElement }, fieldStyle]}>
        <TextInput
          editable={!disabled}
          value={value}
          onChangeText={handleText}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      {open && (loading || items.length > 0) ? (
        <View style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.backgroundElement }]}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
          ) : (
            items.slice(0, 8).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setOpen(false);
                  setItems([]);
                  onSelect(item);
                }}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <Text style={[styles.itemText, { color: theme.text }]}>{item.label}</Text>
                {item.sublabel ? (
                  <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{item.sublabel}</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  field: {
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: {
    height: 44,
    fontSize: 16,
    borderRadius: 10,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loading: {
    padding: 16,
    alignItems: 'center',
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemText: {
    fontSize: 15,
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
