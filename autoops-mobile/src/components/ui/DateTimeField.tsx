import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  disabled?: boolean;
};

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(d: Date): string {
  return d.toLocaleString();
}

export function DateTimeField({ value, onChange, label, disabled }: Props) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View>
        {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
        <View style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            // @ts-expect-error type prop is web-only
            type="datetime-local"
            editable={!disabled}
            value={value ? toLocalInputValue(value) : ''}
            onChangeText={(text) => {
              const d = new Date(text);
              if (!isNaN(d.getTime())) onChange(d);
            }}
            style={[styles.webInput, { color: theme.text }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setShowPicker(true)}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.5 : 1 },
        ]}>
        <Text style={{ color: value ? theme.text : theme.textSecondary, fontSize: 16 }}>
          {value ? formatDisplay(value) : 'Select date and time'}
        </Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          mode="datetime"
          value={value ?? new Date()}
          onChange={(_event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) onChange(selectedDate);
          }}
        />
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
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  webInput: {
    height: 44,
    fontSize: 16,
    borderWidth: 0,
    outlineStyle: 'none',
  } as any,
});
