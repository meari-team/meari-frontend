import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import { useWithdraw } from '@/api/profile';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { colors, radius, spacing } from '@/theme';

const LOSSES = [
  { icon: 'book-outline', label: '모든 일기와 사진' },
  { icon: 'chatbubbles-outline', label: '과거의 나와 나눈 대화' },
  { icon: 'sparkles-outline', label: 'AI가 기억하고 있는 내 기록' },
  { icon: 'checkbox-outline', label: '일정·체크리스트와 프로필' },
] as const;

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
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="warning-outline" size={28} color={colors.danger} />
        </View>
        <Text style={styles.heroTitle}>탈퇴하면 모든 기록이 지워져요</Text>
        <Text style={styles.heroText}>
          지운 기록은 되돌릴 수 없어요. 잠시 쉬고 싶다면 로그아웃만 해도 기록은
          그대로 남아요.
        </Text>
      </View>

      <Section title="함께 지워지는 것">
        <View style={styles.list}>
          {LOSSES.map((l) => (
            <View key={l.label} style={styles.item}>
              <Ionicons name={l.icon} size={18} color={colors.danger} />
              <Text style={styles.itemText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {step === 'intro' ? (
        <>
          <Button title="돌아가기" onPress={() => router.back()} />
          <Button
            title="그래도 탈퇴할래요"
            variant="ghost"
            onPress={() => setStep('confirm')}
            testID="withdraw-continue"
          />
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
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md + 4,
    backgroundColor: colors.dangerSoft,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: { gap: spacing.sm + 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  itemText: { fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontSize: 14 },
});
