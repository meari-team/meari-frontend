import { router, Stack, useLocalSearchParams } from 'expo-router';

import { StyleSheet, Switch, Text, View } from 'react-native';
import { useChecklist, useEntry, useUpdateMemory } from '@/api/entries';
import { ApiError, errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { DeleteEntrySection } from '@/features/entries/DeleteEntrySection';
import { DaySchedulesQuiet, DiaryPage } from '@/features/entries/DiaryPage';
import { formatKoreanDate, normalizeEntryDate } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

// 기억에서 제외는 AI 기억을 먼저 지운다. AI가 안 되면 503
const aiIndexFailMessage = (e: unknown, action: string) =>
  e instanceof ApiError && e.code === 'AI_INDEX_UNAVAILABLE'
    ? `기억 저장소에 연결할 수 없어 ${action} 못했어요. 잠시 후 다시 시도해 주세요.`
    : errorMessage(e);

// 일기 상세. 캘린더와 과거의 나(근거 칩)에서 함께 연다
export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = normalizeEntryDate(params.date);
  const entry = useEntry(date, { pollWhilePending: true });
  const checklist = useChecklist();
  const memory = useUpdateMemory(date);

  const header = <Stack.Screen options={{ title: formatKoreanDate(date) }} />;

  if (entry.isPending || checklist.isPending) {
    return (
      <>
        {header}
        <StateView status="loading" />
      </>
    );
  }
  if (entry.isError || checklist.isError) {
    return (
      <>
        {header}
        <StateView
          status="error"
          message={errorMessage(entry.error ?? checklist.error)}
          onRetry={() => {
            void entry.refetch();
            void checklist.refetch();
          }}
        />
      </>
    );
  }

  const data = entry.data;
  if (!data) {
    return (
      <>
        {header}
        <StateView
          status="empty"
          message="이 날은 기록이 없어요."
          actionLabel="이 날 일기 쓰기"
          onAction={() => router.push(`/today?date=${date}`)}
        />
      </>
    );
  }

  const confirmed = data.status === 'CONFIRMED';

  return (
    <>
      {header}
      <Screen edges={['bottom']}>
        {confirmed ? (
          <DiaryPage date={date} entry={data} categories={checklist.data} />
        ) : (
          <View style={styles.draft}>
            <Text style={styles.draftTitle}>아직 확정하지 않은 일기예요</Text>
            <Text style={styles.draftHint}>
              확정한 일기만 과거의 나의 기억이 돼요.
            </Text>
            <Button
              title="이어 쓰기"
              onPress={() => router.push(`/today?date=${date}`)}
            />
          </View>
        )}

        <DaySchedulesQuiet date={date} />

        {confirmed ? (
          <>
            <View style={styles.actions}>
              <Button
                title="이때의 나와 대화하기"
                testID="talk-to-past-self"
                onPress={() =>
                  router.push({
                    pathname: '/past-self/confirm',
                    params: { anchorDate: date },
                  })
                }
              />
              <Button
                title="수정하기"
                variant="secondary"
                testID="edit-entry"
                onPress={() =>
                  router.push({
                    pathname: '/today',
                    params: { date, edit: String(Date.now()) },
                  })
                }
              />
            </View>

            {/* 기억 포함 여부: 조용한 설정 한 줄 */}
            <View style={styles.setting}>
              <View style={styles.flex}>
                <Text style={styles.settingTitle}>과거의 나 기억에 포함</Text>
                <Text style={styles.settingHint}>
                  끄면 과거의 나와 대화할 때 이 일기를 쓰지 않아요.
                </Text>
              </View>
              <Switch
                accessibilityLabel="과거의 나 기억에 포함"
                value={!data.excludedFromMemory}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
                disabled={memory.isPending}
                onValueChange={(include) => memory.mutate(!include)}
              />
            </View>
            {memory.isError ? (
              <Text style={styles.error}>
                {aiIndexFailMessage(memory.error, '바꾸지')}
              </Text>
            ) : null}
          </>
        ) : null}

        <DeleteEntrySection
          date={date}
          onDeleted={() =>
            router.canGoBack() ? router.back() : router.replace('/calendar')
          }
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  draft: {
    gap: spacing.sm,
    padding: spacing.lg - 2,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  draftTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  draftHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  settingTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  settingHint: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
});
