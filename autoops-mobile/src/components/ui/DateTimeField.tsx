import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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

function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DateTimeField({ value, onChange, label, disabled }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<'idle' | 'date' | 'time'>('idle');
  const base = value ?? new Date();

  if (Platform.OS === 'web') {
    const inputStyle = {
      flex: 1,
      height: 40,
      fontSize: 16,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: theme.text,
      cursor: disabled ? 'not-allowed' : 'pointer',
      minWidth: 0,
    };

    return (
      <View>
        {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
        <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
          <View style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 3 }]}>
            <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
            {React.createElement('input', {
              type: 'date',
              disabled,
              value: value ? toDateString(value) : '',
              onChange: (e: any) => {
                const d = new Date(`${e.target.value}T${formatTime(base)}:00`);
                if (!isNaN(d.getTime())) onChange(d);
              },
              style: inputStyle,
            })}
          </View>
          <View style={[styles.cell, { backgroundColor: theme.backgroundElement, flex: 2 }]}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            {React.createElement('input', {
              type: 'time',
              disabled,
              value: value ? formatTime(value) : '',
              onChange: (e: any) => {
                const [h, m] = (e.target.value as string).split(':').map(Number);
                const d = new Date(base);
                d.setHours(h ?? 0, m ?? 0, 0, 0);
                if (!isNaN(d.getTime())) onChange(d);
              },
              style: inputStyle,
            })}
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
});
