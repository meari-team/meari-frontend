import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSignup } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { AuthButton } from '@/features/auth/AuthButton';
import { AuthField } from '@/features/auth/AuthField';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { AuthSwitch } from '@/features/auth/AuthSwitch';
import { PASSWORD_RE } from '@/lib/password';
import { colors, fonts, warm } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 시안 "회원가입" (Figma 2:9). 간격은 시안 프레임 기준 px
export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const signup = useSignup();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const nicknameRef = useRef<ComponentRef<typeof TextInput>>(null);

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
    <AuthScreen topRatio={239 / 874}>
      <Text style={styles.title} accessibilityRole="header">
        회원가입
      </Text>

      <View style={styles.fields}>
        <AuthField
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={emailError}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          testID="signup-email"
        />
        <AuthField
          ref={passwordRef}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="8자 이상, 영문과 숫자 조합"
          error={passwordError}
          returnKeyType="next"
          onSubmitEditing={() => nicknameRef.current?.focus()}
          testID="signup-password"
        />
        <AuthField
          ref={nicknameRef}
          placeholder="닉네임"
          value={nickname}
          onChangeText={setNickname}
          maxLength={20}
          hint="최대 20자"
          returnKeyType="done"
          onSubmitEditing={canSubmit ? submit : undefined}
          testID="signup-nickname"
        />
      </View>

      {signup.isError ? (
        <Text style={styles.error} testID="signup-error">
          {errorMessage(signup.error)}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <AuthButton
          title="회원가입"
          onPress={submit}
          disabled={!canSubmit}
          loading={signup.isPending}
          testID="signup-submit"
        />
        <AuthSwitch
          question="이미 회원 이신가요?"
          action="로그인"
          onPress={() => router.back()}
          testID="go-login"
        />
      </View>

      {/* AI 기본법: 가입 전에 AI 서비스임을 알린다 (시안에는 없음 — 디자이너와 위치 정하기) */}
      <Text style={styles.notice}>
        메아리는 AI가 사진으로 일기를 정리해 주는 서비스예요.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 27,
    color: warm.black,
    textAlign: 'center',
  },
  fields: { marginTop: 40, gap: 21 },
  error: {
    marginTop: 12,
    marginLeft: 20,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  actions: { marginTop: 19, gap: 13 },
  notice: {
    marginTop: 28,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
  },
});
