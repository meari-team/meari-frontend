import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useChecklist, useEntry, useUpdateMemory } from '@/api/entries';
import { ApiError, errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { AuthButton } from '@/features/auth/AuthButton';
import { DeleteEntrySection } from '@/features/entries/DeleteEntrySection';
import { DaySchedulesQuiet, DiaryPage } from '@/features/entries/DiaryPage';
import { normalizeEntryDate } from '@/lib/dates';
import { colors, fonts, spacing, warm } from '@/theme';

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

  // 머리줄은 뒤로 가기만. 날짜는 일기 맨 위에 이미 있어서 제목은 비운다 (웜톤 바탕, 그림자 줄 없이)
  const header = (
    <Stack.Screen
      options={{
        title: '',
        headerStyle: { backgroundColor: warm.background },
        headerShadowVisible: false,
        headerTintColor: warm.ink,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
      }}
    />
  );

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
      <Screen edges={['bottom']} backgroundColor={warm.background}>
        {confirmed ? (
          <DiaryPage date={date} entry={data} categories={checklist.data} />
        ) : (
          <View style={styles.draft}>
            <Text style={styles.draftTitle}>아직 확정하지 않은 일기예요</Text>
            <Text style={styles.draftHint}>
              확정한 일기만 과거의 나의 기억이 돼요.
            </Text>
            <AuthButton
              title="이어 쓰기"
              onPress={() => router.push(`/today?date=${date}`)}
            />
          </View>
        )}

        <DaySchedulesQuiet date={date} />

        {confirmed ? (
          <>
            <View style={styles.actions}>
              <AuthButton
                title="이때의 나와 대화하기"
                testID="talk-to-past-self"
                onPress={() =>
                  router.push({
                    pathname: '/past-self/confirm',
                    params: { anchorDate: date },
                  })
                }
              />
              <Pressable
                accessibilityRole="button"
                testID="edit-entry"
                onPress={() =>
                  router.push({
                    pathname: '/today',
                    params: { date, edit: String(Date.now()) },
                  })
                }
                style={({ pressed }) => [
                  styles.outline,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.outlineText}>수정하기</Text>
              </Pressable>
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
                trackColor={{ true: warm.tan, false: warm.sand }}
                thumbColor={warm.field}
                // 웹(react-native-web)은 켜진 손잡이 색을 따로 받는다 (안 주면 청록색)
                {...({ activeThumbColor: warm.field } as object)}
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
  pressed: { opacity: 0.7 },
  draft: {
    gap: spacing.sm,
    padding: 22,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  draftTitle: { fontFamily: fonts.bold, fontSize: 17, color: warm.black },
  draftHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: warm.tan,
    marginBottom: spacing.sm,
  },
  actions: { gap: 10, marginTop: spacing.sm },
  // 보조 버튼: 주 버튼과 같은 알약, 테두리만
  outline: {
    height: 45,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.brown },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: warm.sand,
  },
  settingTitle: { fontFamily: fonts.semibold, fontSize: 15, color: warm.ink },
  settingHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: warm.tan,
  },
  error: { color: colors.danger, fontSize: 14 },
});
