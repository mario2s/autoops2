import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/format';

export type ServiceRowValue = {
  description: string;
  costType: 'hourly' | 'fixed';
  hours: string;
  rate: string;
  fixedAmount: string;
};

type Props = {
  value: ServiceRowValue;
  onChange: (v: ServiceRowValue) => void;
  onRemove: () => void;
};

export function ServiceRow({ value, onChange, onRemove }: Props) {
  const theme = useTheme();
  const isHourly = value.costType === 'hourly';
  const hours = parseFloat(value.hours) || 0;
  const rate = parseFloat(value.rate) || 0;
  const fixed = parseFloat(value.fixedAmount) || 0;
  const total = isHourly ? hours * rate : fixed;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.descCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Description</Text>
        <TextInput
          value={value.description}
          onChangeText={(t) => onChange({ ...value, description: t })}
          placeholder="Service description"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        />
      </View>

      <View style={styles.toggle}>
        <Pressable
          onPress={() => onChange({ ...value, costType: 'hourly' })}
          style={[
            styles.toggleBtn,
            { backgroundColor: isHourly ? theme.accent : theme.background },
          ]}>
          <Text style={[styles.toggleText, { color: isHourly ? theme.accentText : theme.textSecondary }]}>
            Hourly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ ...value, costType: 'fixed' })}
          style={[
            styles.toggleBtn,
            { backgroundColor: !isHourly ? theme.accent : theme.background },
          ]}>
          <Text style={[styles.toggleText, { color: !isHourly ? theme.accentText : theme.textSecondary }]}>
            Fixed
          </Text>
        </Pressable>
      </View>

      <View style={styles.numCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Hours</Text>
        <TextInput
          editable={isHourly}
          value={isHourly ? value.hours : ''}
          onChangeText={(t) => onChange({ ...value, hours: t })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.background, opacity: isHourly ? 1 : 0.4 },
          ]}
        />
      </View>

      <View style={styles.numCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Rate</Text>
        <TextInput
          editable={isHourly}
          value={isHourly ? value.rate : ''}
          onChangeText={(t) => onChange({ ...value, rate: t })}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.background, opacity: isHourly ? 1 : 0.4 },
          ]}
        />
      </View>

      <View style={styles.numCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Total</Text>
        {isHourly ? (
          <Text style={[styles.totalText, { color: theme.text }]}>{formatCurrency(total)}</Text>
        ) : (
          <TextInput
            value={value.fixedAmount}
            onChangeText={(t) => onChange({ ...value, fixedAmount: t })}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          />
        )}
      </View>

      <Pressable onPress={onRemove} style={styles.remove}>
        <Text style={styles.removeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  descCol: {},
  toggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  numCol: { flex: 1, minWidth: 80 },
  cellLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 10,
  },
  remove: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 20, color: 'rgba(255,255,255,0.3)', lineHeight: 20 },
});
