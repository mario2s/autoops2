import { Ionicons } from '@expo/vector-icons';
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDisplay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}  ·  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeField({ value, onChange, label, disabled }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<'idle' | 'date' | 'time'>('idle');

  if (Platform.OS === 'web') {
    return (
      <View>
        {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
        <View style={[styles.input, { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.5 : 1 }]}>
          <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
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

  const base = value ?? new Date();

  return (
    <View>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setStep('date')}
        style={[styles.input, { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.5 : 1 }]}>
        <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
        <Text style={[styles.valueText, { color: value ? theme.text : theme.textSecondary }]}>
          {value ? formatDisplay(value) : 'Select date and time'}
        </Text>
      </Pressable>

      {step === 'date' && (
        <DateTimePicker
          mode="date"
          value={base}
          onChange={(_event, selected) => {
            if (selected) {
              const merged = new Date(selected);
              merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
              onChange(merged);
              setStep('time');
            } else {
              setStep('idle');
            }
          }}
        />
      )}
      {step === 'time' && (
        <DateTimePicker
          mode="time"
          value={base}
          onChange={(_event, selected) => {
            setStep('idle');
            if (selected) onChange(selected);
          }}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valueText: {
    fontSize: 14,
    flex: 1,
  },
  webInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: 'none',
  } as any,
});
