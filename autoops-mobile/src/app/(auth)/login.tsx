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
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Car shop operations</Text>

          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={submitting}
              style={[
                styles.button,
                {
                  backgroundColor: theme.accent,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}>
              {submitting ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.accentText }]}>Log in</Text>
              )}
            </Pressable>

            <Text style={[styles.footerHint, { color: theme.textMuted }]}>
              Register on the web app
            </Text>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: { gap: 10 },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  button: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
  },
  footerHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
