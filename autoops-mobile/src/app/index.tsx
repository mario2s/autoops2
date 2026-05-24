import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getValidSession } from '@/lib/auth';

export default function Index() {
  const [state, setState] = useState<'loading' | 'authed' | 'guest'>('loading');

  useEffect(() => {
    (async () => {
      const session = await getValidSession();
      setState(session ? 'authed' : 'guest');
    })();
  }, []);

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (state === 'authed') return <Redirect href="/orders" />;
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
