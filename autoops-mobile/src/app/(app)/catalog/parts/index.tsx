import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export default function PartsListScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Parts</Text>
      <View style={styles.center}>
        <Text style={{ color: theme.textSecondary }}>Coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
