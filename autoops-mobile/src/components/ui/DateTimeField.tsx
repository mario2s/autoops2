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

function formatDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeField({ value, onChange, label, disabled }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<'idle' | 'date' | 'time'>('idle');
  const base = value ?? new Date();

  if (Platform.OS === 'web') {
    return (
      <View>
        {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
        <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
          <View style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 3 }]}>
            <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
            <TextInput
              // @ts-expect-error web-only
              type="date"
              editable={!disabled}
              value={value ? toLocalInputValue(value).split('T')[0] : ''}
              onChangeText={(text) => {
                const existing = value ?? new Date();
                const d = new Date(`${text}T${formatTime(existing).replace(':', ':')}:00`);
                if (!isNaN(d.getTime())) onChange(d);
              }}
              style={[styles.webInput, { color: theme.text }]}
            />
          </View>
          <View style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 2 }]}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            <TextInput
              // @ts-expect-error web-only
              type="time"
              editable={!disabled}
              value={value ? formatTime(value) : ''}
              onChangeText={(text) => {
                const existing = value ?? new Date();
                const [h, m] = text.split(':').map(Number);
                const d = new Date(existing);
                d.setHours(h ?? 0, m ?? 0, 0, 0);
                if (!isNaN(d.getTime())) onChange(d);
              }}
              style={[styles.webInput, { color: theme.text }]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
        <Pressable
          disabled={disabled}
          onPress={() => setStep('date')}
          style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 3 }]}>
          <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
          <View>
            <Text style={[styles.cellHint, { color: theme.textMuted }]}>Date</Text>
            <Text style={[styles.cellValue, { color: value ? theme.text : theme.textSecondary }]}>
              {value ? formatDate(value) : 'Select date'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          disabled={disabled}
          onPress={() => setStep('time')}
          style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 2 }]}>
          <Ionicons name="time-outline" size={14} color={theme.textMuted} />
          <View>
            <Text style={[styles.cellHint, { color: theme.textMuted }]}>Time</Text>
            <Text style={[styles.cellValue, { color: value ? theme.text : theme.textSecondary }]}>
              {value ? formatTime(value) : '--:--'}
            </Text>
          </View>
        </Pressable>
      </View>

      {step === 'date' && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={base}
          onChange={(_event, selected) => {
            if (selected) {
              const merged = new Date(selected);
              merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
              onChange(merged);
            }
            setStep('idle');
          }}
        />
      )}
      {step === 'time' && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellHint: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  webInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: 'none',
  } as any,
});
