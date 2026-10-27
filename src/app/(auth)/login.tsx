import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLogin } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { AuthButton } from '@/features/auth/AuthButton';
import { AuthField } from '@/features/auth/AuthField';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { AuthSwitch } from '@/features/auth/AuthSwitch';
import { colors, fonts, warm } from '@/theme';

// 시안 "로그인" (Figma 2:8). 간격은 시안 프레임 기준 px
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;
  const submit = () => login.mutate({ email: email.trim(), password });

  return (
    <AuthScreen topRatio={218 / 874}>
      {/* 로고 자리: 로고가 나오면 이미지로 바꾼다 */}
      <Text style={styles.logo} accessibilityRole="header">
        메아리
      </Text>
      <Text style={styles.tagline}>사진 몇 장으로 남기는 오늘</Text>

      <View style={styles.fields}>
        <AuthField
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          testID="login-email"
        />
        <AuthField
          ref={passwordRef}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={canSubmit ? submit : undefined}
          testID="login-password"
        />
      </View>

      {login.isError ? (
        <Text style={styles.error} testID="login-error">
          {errorMessage(login.error)}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <AuthButton
          title="로그인"
          onPress={submit}
          disabled={!canSubmit}
          loading={login.isPending}
          testID="login-submit"
        />
        <AuthSwitch
          question="아직 회원이 아니신가요?"
          action="회원가입"
          onPress={() => router.push('/signup')}
          testID="go-signup"
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: warm.black,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: warm.black,
    textAlign: 'center',
  },
  fields: { marginTop: 106, gap: 17 },
  error: {
    marginTop: 12,
    marginLeft: 20,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  actions: { marginTop: 40, gap: 13 },
});
