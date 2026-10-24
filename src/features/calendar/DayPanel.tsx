import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import {
  useDaySchedules,
  useToggleSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SafeImage } from '@/components/SafeImage';
import { dayTitleOf } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

type Props = {
  date: string;
  today: string;
  entry?: EntrySummaryDto;
  // 일정을 누르면 수정 시트를 연다
  onEditSchedule: (schedule: ScheduleDto) => void;
};

// 캘린더에서 고른 날: "20. 화" 제목 + 할 일(일정 체크) + 그날 일기
export function DayPanel({ date, today, entry, onEditSchedule }: Props) {
  return (
    <View style={styles.wrap} testID="day-panel">
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.date}>{dayTitleOf(date)}</Text>
        {date === today ? <Badge label="오늘" tone="info" /> : null}
      </View>

      <Todos date={date} onEdit={onEditSchedule} />
      <EntryCard date={date} today={today} entry={entry} />
    </View>
  );
}

function Todos({
  date,
  onEdit,
}: {
  date: string;
  onEdit: (schedule: ScheduleDto) => void;
}) {
  const list = useDaySchedules(date);
  const toggle = useToggleSchedule();

  let body;
  if (list.isPending) {
    body = <ActivityIndicator color={colors.primary} />;
  } else if (list.isError) {
    body = (
      <>
        <Text style={styles.error}>{errorMessage(list.error)}</Text>
        <Button
          title="다시 불러오기"
          variant="ghost"
          onPress={() => void list.refetch()}
        />
      </>
    );
  } else if (list.data.length === 0) {
    body = (
      <Text style={styles.empty}>
        일정이 없어요. 오른쪽 아래 + 로 추가해 보세요.
      </Text>
    );
  } else {
    body = list.data.map((s) => (
      <View key={s.id} style={styles.todo} testID={`schedule-${s.id}`}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`${s.title} 완료`}
          accessibilityState={{ checked: s.completed }}
          aria-checked={s.completed}
          hitSlop={8}
          testID={`schedule-check-${s.id}`}
          onPress={() => toggle.mutate({ id: s.id, completed: !s.completed })}
          style={[styles.check, s.completed && styles.checkOn]}
        >
          {s.completed ? (
            <Ionicons name="checkmark" size={16} color={colors.surface} />
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${s.title} 수정`}
          onPress={() => onEdit(s)}
          style={({ pressed }) => [styles.todoBody, pressed && styles.pressed]}
        >
          <Text
            style={[styles.todoTitle, s.completed && styles.todoDone]}
            numberOfLines={2}
          >
            {s.title}
          </Text>
          <Text style={styles.todoTime}>{s.time ?? '종일'}</Text>
        </Pressable>
      </View>
    ));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>할 일 · 일정</Text>
      {body}
      {toggle.isError ? (
        <Text style={styles.error}>{errorMessage(toggle.error)}</Text>
      ) : null}
    </View>
  );
}

function EntryCard({
  date,
  today,
  entry,
}: {
  date: string;
  today: string;
  entry?: EntrySummaryDto;
}) {
  if (date > today) {
    return (
      <Text style={styles.note}>
        미래 날짜에는 일정만 넣을 수 있어요. 일기는 그날이 되면 써요.
      </Text>
    );
  }
  if (!entry) {
    return (
      <Button
        title="이 날 일기 쓰기"
        variant="ghost"
        testID="write-entry"
        onPress={() => router.push(`/today?date=${date}`)}
      />
    );
  }
  const confirmed = entry.status === 'CONFIRMED';
  return (
    <Pressable
      testID={confirmed ? 'open-entry' : 'write-entry'}
      accessibilityRole="button"
      accessibilityLabel={confirmed ? '일기 보기' : '일기 이어 쓰기'}
      onPress={() =>
        router.push(confirmed ? `/entry/${date}` : `/today?date=${date}`)
      }
      style={({ pressed }) => [
        styles.card,
        styles.entry,
        pressed && styles.pressed,
      ]}
    >
      <SafeImage uri={entry.coverPhotoUrl} style={styles.thumb} />
      <View style={styles.entryBody}>
        <View style={styles.entryHead}>
          <Text style={styles.cardLabel}>일기</Text>
          {!confirmed ? (
            <Badge label="작성 중" tone="warning" icon="create-outline" />
          ) : null}
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {entry.summary ??
            (confirmed ? '일기 보기' : '아직 일기를 완성하지 않았어요')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: {
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  todo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary },
  todoBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todoTitle: { flex: 1, fontSize: 16, color: colors.text },
  todoDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  todoTime: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.6 },
  empty: { fontSize: 14, color: colors.textMuted },
  error: { fontSize: 13, color: colors.danger },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  entryBody: { flex: 1, gap: 4 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summary: { fontSize: 15, color: colors.text },
});
