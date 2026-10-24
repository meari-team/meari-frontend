import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLogin } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const canSubmit = email.trim().length > 0 && password.length > 0;
  const submit = () => login.mutate({ email: email.trim(), password });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>메아리</Text>
        <Text style={styles.subtitle}>사진 한 장으로 쓰는 AI 일기</Text>
      </View>

      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="me@example.com"
        testID="login-email"
      />
      <TextField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={canSubmit ? submit : undefined}
        testID="login-password"
      />

      {login.isError ? (
        <Text style={styles.error} testID="login-error">
          {errorMessage(login.error)}
        </Text>
      ) : null}

      <Button
        title="로그인"
        onPress={submit}
        disabled={!canSubmit}
        loading={login.isPending}
      />
      <Button
        title="처음이에요 · 회원가입"
        variant="ghost"
        onPress={() => router.push('/signup')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.lg, gap: spacing.xs },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
});
