import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useTheme } from '@/hooks/use-theme';
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Paginated, Part } from '@/lib/types';

export type PartRowValue = {
  catalogPartId: string | null;
  partName: string;
  qty: string;
  unitPrice: string;
};

type Props = {
  value: PartRowValue;
  onChange: (v: PartRowValue) => void;
  onRemove: () => void;
};

async function searchParts(q: string) {
  const res = await get<Paginated<Part>>(`/api/v1/catalog/parts?search=${encodeURIComponent(q)}&pageSize=8`);
  return res.data.map((p) => ({ id: p.id, label: p.name }));
}

export function PartRow({ value, onChange, onRemove }: Props) {
  const theme = useTheme();
  const qty = parseFloat(value.qty) || 0;
  const unit = parseFloat(value.unitPrice) || 0;
  const total = qty * unit;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.flex}>
        <SearchableSelect
          value={value.partName}
          onChangeText={(text) => onChange({ ...value, partName: text, catalogPartId: null })}
          onSelect={(item) =>
            onChange({ ...value, catalogPartId: item.id, partName: item.label })
          }
          fetcher={searchParts}
          placeholder="Part name"
        />
      </View>
      <View style={styles.numCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Qty</Text>
        <TextInput
          value={value.qty}
          onChangeText={(t) => onChange({ ...value, qty: t })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.numInput, { color: theme.text, backgroundColor: theme.background }]}
        />
      </View>
      <View style={styles.numCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Unit price</Text>
        <TextInput
          value={value.unitPrice}
          onChangeText={(t) => onChange({ ...value, unitPrice: t })}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={theme.textSecondary}
          style={[styles.numInput, { color: theme.text, backgroundColor: theme.background }]}
        />
      </View>
      <View style={styles.totalCol}>
        <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>Total</Text>
        <Text style={[styles.totalText, { color: theme.text }]}>{formatCurrency(total)}</Text>
      </View>
      <Pressable onPress={onRemove} style={styles.remove}>
        <Text style={styles.removeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  flex: { flexBasis: '100%', flexGrow: 1, minWidth: 160 },
  numCol: { width: 90 },
  totalCol: { width: 90 },
  cellLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  numInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  totalText: { fontSize: 15, fontWeight: '600', paddingVertical: 10 },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 20, color: 'rgba(255,255,255,0.3)', lineHeight: 20 },
});
