import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ApiError, post } from '@/lib/api';
import { setToken } from '@/lib/auth';
import type { LoginResponse } from '@/lib/types';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await post<{ data: LoginResponse }>(
        '/api/v1/auth/login',
        { email: email.trim(), password },
        { skipAuthRedirect: true },
      );
      await setToken(res.data.token);
      router.replace('/orders');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) setError('Invalid email or password');
        else if (e.status === 403 && e.code === 'ACCOUNT_NOT_ACTIVE')
          setError('Your account is pending admin approval');
        else setError(e.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: theme.text }]}>AutoOps</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to continue
          </Text>

          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={submitting || !email || !password}
              style={[
                styles.button,
                { opacity: submitting || !email || !password ? 0.6 : 1 },
              ]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  form: { gap: 16 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#208AEF',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
  },
});
