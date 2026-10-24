import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import { useWithdraw } from '@/api/profile';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { colors, spacing } from '@/theme';

const LOSSES = [
  '모든 일기와 사진',
  '과거의 나와 나눈 대화',
  'AI가 기억하고 있는 내 기록',
  '체크리스트와 프로필',
];

// 서버가 AI 기억을 먼저 지우고, 하나라도 실패하면 아무것도 지우지 않는다 (503)
const withdrawFailMessage = (e: unknown) =>
  e instanceof ApiError && e.code === 'AI_INDEX_UNAVAILABLE'
    ? '기억 저장소에 연결할 수 없어 탈퇴하지 못했어요. 아무것도 지워지지 않았어요. 잠시 후 다시 시도해 주세요.'
    : errorMessage(e);

// 회원 탈퇴: 안내 → 최종 확인 2단계. 성공하면 로그인 화면으로 돌아간다
export default function WithdrawScreen() {
  const [step, setStep] = useState<'intro' | 'confirm'>('intro');
  const withdraw = useWithdraw();

  return (
    <Screen edges={[]}>
      <Section title="탈퇴하면 이것들이 모두 지워져요">
        <View style={styles.list}>
          {LOSSES.map((l) => (
            <Text key={l} style={styles.item}>
              · {l}
            </Text>
          ))}
        </View>
        <Text style={styles.warn}>지운 기록은 되돌릴 수 없어요.</Text>
      </Section>

      {step === 'intro' ? (
        <>
          <Button
            title="계속"
            variant="ghost"
            onPress={() => setStep('confirm')}
            testID="withdraw-continue"
          />
          <Button title="돌아가기" onPress={() => router.back()} />
        </>
      ) : (
        <Section
          title="정말 탈퇴할까요?"
          hint="버튼을 누르면 바로 모든 기록이 지워지고 로그아웃돼요."
        >
          <Button
            title="모든 기록 지우고 탈퇴"
            variant="danger"
            loading={withdraw.isPending}
            onPress={() => withdraw.mutate()}
            testID="withdraw-confirm"
          />
          <Button
            title="취소"
            variant="ghost"
            disabled={withdraw.isPending}
            onPress={() => {
              withdraw.reset();
              setStep('intro');
            }}
          />
          {withdraw.isError ? (
            <Text style={styles.error} testID="withdraw-error">
              {withdrawFailMessage(withdraw.error)}
            </Text>
          ) : null}
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  item: { fontSize: 15, color: colors.text },
  warn: { fontSize: 14, color: colors.danger, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
});
