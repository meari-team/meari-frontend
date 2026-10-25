import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import { useChangePassword } from '@/api/profile';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { checkPasswordChange, PASSWORD_RULE } from '@/lib/password';
import { colors, spacing } from '@/theme';

// 비밀번호 변경 (U4). 바꿔도 로그인은 그대로 유지된다
export default function PasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const change = useChangePassword();
  const nextRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);

  const check = checkPasswordChange({ current, next, confirm });
  // 지금 비밀번호가 틀린 건 그 칸 아래에, 나머지 서버 오류는 맨 아래에
  const wrongCurrent =
    change.error instanceof ApiError && change.error.code === 'WRONG_PASSWORD';

  const submit = () => {
    if (!check.canSubmit || change.isPending) return;
    change.mutate({ currentPassword: current, newPassword: next });
  };

  if (change.isSuccess) {
    return (
      <Screen
        edges={[]}
        footer={<Button title="확인" onPress={() => router.back()} />}
      >
        <View style={styles.done} testID="password-done">
          <Text style={styles.doneTitle}>비밀번호를 바꿨어요</Text>
          <Text style={styles.doneText}>
            다음에 로그인할 때부터 새 비밀번호를 써 주세요.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={[]}
      footer={
        <Button
          title="변경하기"
          onPress={submit}
          disabled={!check.canSubmit}
          loading={change.isPending}
          testID="password-submit"
        />
      }
    >
      <TextField
        label="지금 비밀번호"
        value={current}
        onChangeText={(v) => {
          setCurrent(v);
          if (wrongCurrent) change.reset();
        }}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        error={wrongCurrent ? errorMessage(change.error) : null}
        returnKeyType="next"
        onSubmitEditing={() => nextRef.current?.focus()}
        testID="password-current"
      />
      <TextField
        ref={nextRef}
        label="새 비밀번호"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={PASSWORD_RULE}
        error={check.nextError}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        testID="password-new"
      />
      <TextField
        ref={confirmRef}
        label="새 비밀번호 확인"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={check.confirmError}
        returnKeyType="done"
        onSubmitEditing={submit}
        testID="password-confirm"
      />

      {change.isError && !wrongCurrent ? (
        <Text style={styles.error} testID="password-error">
          {errorMessage(change.error)}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { gap: spacing.sm, paddingTop: spacing.lg },
  doneTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  doneText: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  error: { fontSize: 14, color: colors.danger },
});
