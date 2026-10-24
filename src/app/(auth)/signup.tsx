import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSignup } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

// 서버 규칙과 같다 (SignupDto): 8~64자, 영문과 숫자 각각 1자 이상
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const signup = useSignup();

  const emailError =
    email.length > 0 && !EMAIL_RE.test(email.trim())
      ? '이메일 형식을 확인해 주세요.'
      : null;
  const passwordError =
    password.length > 0 && !PASSWORD_RE.test(password)
      ? '8~64자, 영문과 숫자를 함께 써 주세요.'
      : null;
  const nicknameValid =
    nickname.trim().length >= 1 && nickname.trim().length <= 20;

  const canSubmit =
    EMAIL_RE.test(email.trim()) && PASSWORD_RE.test(password) && nicknameValid;

  const submit = () =>
    signup.mutate({ email: email.trim(), password, nickname: nickname.trim() });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>
          메아리는 AI가 일기를 써 주고, 기록으로 재구성한 과거의 나와 대화하는
          서비스예요. AI가 만든 내용에는 항상 표시가 붙어요.
        </Text>
      </View>

      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={emailError}
        testID="signup-email"
      />
      <TextField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="8~64자, 영문과 숫자를 함께"
        error={passwordError}
        testID="signup-password"
      />
      <TextField
        label="닉네임"
        value={nickname}
        onChangeText={setNickname}
        maxLength={20}
        hint="최대 20자"
        testID="signup-nickname"
      />

      {signup.isError ? (
        <Text style={styles.error} testID="signup-error">
          {errorMessage(signup.error)}
        </Text>
      ) : null}

      <Button
        title="가입하기"
        onPress={submit}
        disabled={!canSubmit}
        loading={signup.isPending}
      />
      <Button
        title="이미 계정이 있어요"
        variant="ghost"
        onPress={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
});
