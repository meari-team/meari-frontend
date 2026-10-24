import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  useChecklist,
  useDeleteEntry,
  useEntry,
  useUpdateMemory,
} from '@/api/entries';
import { ApiError, errorMessage } from '@/api/errors';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { ScheduleList } from '@/features/schedules/ScheduleList';
import { StateView } from '@/components/StateView';
import { PhotoCarousel } from '@/features/calendar/PhotoCarousel';
import { indexBadgeOf } from '@/features/today/stage';
import { formatKoreanDate, normalizeEntryDate } from '@/lib/dates';
import { colors, spacing } from '@/theme';

// 삭제·기억에서 제외는 AI 기억을 먼저 지운다. AI가 안 되면 503
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
  const remove = useDeleteEntry(date);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
  const badge = confirmed ? indexBadgeOf(data.aiIndexStatus) : null;
  const checked = new Set(data.checkedItemIds);
  const items = checklist.data.flatMap((c) =>
    c.items
      .filter((i) => checked.has(i.id))
      .map((i) => ({ ...i, color: c.color })),
  );

  const onDelete = () =>
    remove.mutate(undefined, {
      onSuccess: () =>
        router.canGoBack() ? router.back() : router.replace('/calendar'),
    });

  return (
    <>
      {header}
      <Screen edges={['bottom']}>
        <View style={styles.badges}>
          {!confirmed ? (
            <Badge label="작성 중" tone="warning" icon="create-outline" />
          ) : null}
          {badge ? (
            <Badge
              label={badge.label}
              tone={badge.tone}
              spinning={badge.spinning}
            />
          ) : null}
          {data.excludedFromMemory ? <Badge label="기억에서 제외됨" /> : null}
        </View>

        {data.photos.length > 0 ? <PhotoCarousel photos={data.photos} /> : null}

        {confirmed ? (
          <Text style={styles.content} selectable testID="entry-content">
            {data.finalContent}
          </Text>
        ) : (
          <Section
            title="아직 확정하지 않은 일기예요"
            hint="확정한 일기만 과거의 나의 기억이 돼요."
          >
            <Button
              title="이어 쓰기"
              onPress={() => router.push(`/today?date=${date}`)}
            />
          </Section>
        )}

        {items.length > 0 ? (
          <View style={styles.chips}>
            {items.map((i) => (
              <Chip key={i.id} label={i.label} color={i.color} />
            ))}
          </View>
        ) : null}

        <ScheduleList date={date} title="이 날 일정" emptyText={null} />

        {confirmed ? (
          <>
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

            <Section
              title="기억에서 제외"
              hint="켜면 과거의 나와 대화할 때 이 일기를 쓰지 않아요."
            >
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  {data.excludedFromMemory ? '제외됨' : '기억에 포함'}
                </Text>
                <Switch
                  accessibilityLabel="기억에서 제외"
                  value={data.excludedFromMemory}
                  disabled={memory.isPending}
                  onValueChange={(v) => memory.mutate(v)}
                />
              </View>
              {memory.isError ? (
                <Text style={styles.error}>
                  {aiIndexFailMessage(memory.error, '바꾸지')}
                </Text>
              ) : null}
            </Section>
          </>
        ) : null}

        <View style={styles.deleteArea}>
          {confirmingDelete ? (
            <Section
              title="이 일기를 지울까요?"
              hint="사진과 과거의 나의 기억에서도 함께 지워지고, 되돌릴 수 없어요."
            >
              <Button
                title="삭제"
                variant="danger"
                loading={remove.isPending}
                onPress={onDelete}
                testID="confirm-delete"
              />
              <Button
                title="취소"
                variant="ghost"
                disabled={remove.isPending}
                onPress={() => {
                  setConfirmingDelete(false);
                  remove.reset();
                }}
              />
              {remove.isError ? (
                <Text style={styles.error}>
                  {aiIndexFailMessage(remove.error, '지우지')}
                </Text>
              ) : null}
            </Section>
          ) : (
            <Button
              title="일기 삭제"
              variant="ghost"
              onPress={() => setConfirmingDelete(true)}
            />
          )}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  content: { fontSize: 16, lineHeight: 26, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontSize: 14 },
  deleteArea: { marginTop: spacing.lg },
});
