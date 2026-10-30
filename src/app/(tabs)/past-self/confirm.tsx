import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { useAvailability, useCreateSession } from '@/api/past-self';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StateView } from '@/components/StateView';
import {
  availabilityHint,
  pastSelfTitle,
  shortKoreanDate,
} from '@/features/past-self/logic';
import { normalizeEntryDate } from '@/lib/dates';
import { colors, fonts, warm } from '@/theme';

// 시점 확인: 쓰이는 기록 범위와 "미래 정보 제한"을 알린 뒤 대화를 시작한다
export default function ConfirmAnchor() {
  const params = useLocalSearchParams<{ anchorDate?: string }>();
  const anchorDate = normalizeEntryDate(params.anchorDate);
  const availability = useAvailability(anchorDate);
  const create = useCreateSession();
  const header = (
    <Stack.Screen options={{ title: pastSelfTitle(anchorDate) }} />
  );

  if (availability.isPending) {
    return (
      <>
        {header}
        <StateView status="loading" />
      </>
    );
  }
  if (availability.isError) {
    return (
      <>
        {header}
        <StateView
          status="error"
          message={errorMessage(availability.error)}
          onRetry={() => void availability.refetch()}
        />
      </>
    );
  }

  const a = availability.data;
  const hint = availabilityHint(a.recordCount, a.requiredCount);
  const start = () =>
    create.mutate(anchorDate, {
      onSuccess: (s) =>
        router.replace({
          pathname: '/past-self/[sessionId]',
          params: { sessionId: s.id, anchorDate: s.anchorDate },
        }),
    });

  return (
    <>
      {header}
      <Screen edges={[]}>
        <Text style={styles.title}>{pastSelfTitle(anchorDate)}와 대화해요</Text>

        <Section title="쓰이는 기록">
          {a.firstRecordDate ? (
            <Text style={styles.body} testID="record-range">
              {shortKoreanDate(a.firstRecordDate)}부터{' '}
              {shortKoreanDate(anchorDate)}까지 확정한 일기{' '}
              <Text style={styles.strong}>{a.recordCount}편</Text>
            </Text>
          ) : (
            <Text style={styles.body}>이 날까지 확정한 일기가 없어요.</Text>
          )}
          {hint ? <Text style={styles.warn}>{hint}</Text> : null}
        </Section>

        <Section title="이렇게 대화해요">
          <View style={styles.notes}>
            {[
              `${shortKoreanDate(anchorDate)} 이후의 일은 그때의 나가 알지 못해요.`,
              '기록에 없는 내용은 모른다고 답해요.',
              '답마다 참고한 일기 날짜를 보여 줘요. 눌러서 원문을 볼 수 있어요.',
              'AI가 기록으로 재구성한 모습이며, 실제 그때의 나와 다를 수 있어요.',
            ].map((line) => (
              <View key={line} style={styles.noteRow}>
                <Text style={styles.bullet}>·</Text>
                <Text style={styles.note}>{line}</Text>
              </View>
            ))}
          </View>
        </Section>

        {create.isError ? (
          <Text style={styles.error}>{errorMessage(create.error)}</Text>
        ) : null}
        <Button
          title="대화 시작"
          testID="start-chat"
          disabled={!a.available}
          loading={create.isPending}
          onPress={start}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 20, color: warm.black },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: warm.ink,
  },
  strong: { fontFamily: fonts.bold, color: warm.brown },
  warn: { fontFamily: fonts.semibold, fontSize: 13, color: warm.clay },
  notes: { gap: 6 },
  noteRow: { flexDirection: 'row', gap: 6 },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 20,
    color: warm.tan,
  },
  note: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.brown,
  },
  error: { color: colors.danger, fontSize: 14 },
});
