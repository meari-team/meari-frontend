import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import { useWithdraw } from '@/api/profile';
import { Screen } from '@/components/Screen';
import { AuthButton } from '@/features/auth/AuthButton';
import { DangerButton, TextButton, WarmCard } from '@/features/my/components';
import { colors, fonts, warm } from '@/theme';

const LOSSES = [
  '모든 일기와 사진',
  '과거의 나와 나눈 대화',
  'AI가 기억하고 있는 내 기록',
  '일정·체크리스트와 프로필',
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
    <Screen edges={[]} backgroundColor={warm.background}>
      <WarmCard
        title="탈퇴하면 모든 기록이 지워져요"
        hint="지운 기록은 되돌릴 수 없어요. 잠시 쉬고 싶다면 로그아웃만 해도 기록은 그대로 남아요."
      >
        <View style={styles.list}>
          <Text style={styles.listTitle}>함께 지워지는 것</Text>
          {LOSSES.map((label) => (
            <View key={label} style={styles.item}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.itemText}>{label}</Text>
            </View>
          ))}
        </View>
      </WarmCard>

      {step === 'intro' ? (
        <>
          <AuthButton title="돌아가기" onPress={() => router.back()} />
          <TextButton
            title="그래도 탈퇴할래요"
            onPress={() => setStep('confirm')}
            testID="withdraw-continue"
          />
        </>
      ) : (
        <WarmCard
          title="정말 탈퇴할까요?"
          hint="버튼을 누르면 바로 모든 기록이 지워지고 로그아웃돼요."
        >
          <DangerButton
            title="모든 기록 지우고 탈퇴"
            loading={withdraw.isPending}
            onPress={() => withdraw.mutate()}
            testID="withdraw-confirm"
          />
          <TextButton
            title="취소"
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
        </WarmCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 지워지는 것 목록: 카드 안 모래색 테두리 상자
  list: {
    gap: 6,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: warm.sand,
    backgroundColor: warm.background,
  },
  listTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    marginBottom: 2,
  },
  item: { flexDirection: 'row', gap: 6 },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: warm.sunday,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: warm.ink,
  },
  error: { color: colors.danger, fontSize: 14 },
});
