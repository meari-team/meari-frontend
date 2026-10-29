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
  useSchedules,
  useToggleSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SafeImage } from '@/components/SafeImage';
import { dayTitleOf } from '@/lib/calendar';
import { colors, fonts, spacing, warm } from '@/theme';

// 캘린더가 이미 읽어 둔 격자 전체 기간의 일정 (날마다 따로 읽지 않는다)
type MonthSchedules = ReturnType<typeof useSchedules>;

type Props = {
  date: string;
  today: string;
  entry?: EntrySummaryDto;
  schedules: MonthSchedules;
  // 일정을 누르면 수정 시트를 연다
  onEditSchedule: (schedule: ScheduleDto) => void;
};

// 캘린더에서 고른 날: "20. 화" 제목 + 할 일(일정 체크) + 그날 일기
// 그날 일정은 캘린더가 읽어 둔 달 일정에서 골라 쓴다 — 날짜·달을 바꿔도 로딩으로 접혔다 펴지지 않는다
export function DayPanel({
  date,
  today,
  entry,
  schedules,
  onEditSchedule,
}: Props) {
  return (
    <View style={styles.wrap} testID="day-panel">
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.date}>{dayTitleOf(date)}</Text>
        {date === today ? <Badge label="오늘" tone="warm" /> : null}
      </View>

      <Todos date={date} list={schedules} onEdit={onEditSchedule} />
      <EntryCard date={date} today={today} entry={entry} />
    </View>
  );
}

function Todos({
  date,
  list,
  onEdit,
}: {
  date: string;
  list: MonthSchedules;
  onEdit: (schedule: ScheduleDto) => void;
}) {
  const toggle = useToggleSchedule();
  const items = (list.data ?? []).filter((s) => s.date === date);

  let body;
  if (list.isPending) {
    body = <ActivityIndicator color={warm.tan} />;
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
  } else if (items.length === 0) {
    body = (
      <Text style={styles.empty}>
        일정이 없어요. 오른쪽 아래 + 로 추가해 보세요.
      </Text>
    );
  } else {
    body = items.map((s) => (
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
            <Ionicons name="checkmark" size={15} color={warm.field} />
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
          {s.time ? <Text style={styles.todoTime}>{s.time}</Text> : null}
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
  // 일기 쓰기는 + 메뉴(AddMenu)에서 한다
  if (!entry) return null;
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
          {/* 작성 중은 꾸밈 없이 글자로만 */}
          <Text style={styles.cardLabel}>
            일기
            {!confirmed ? <Text style={styles.writing}> · 작성 중</Text> : null}
          </Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {entry.summary ??
            (confirmed ? '일기 보기' : '아직 일기를 완성하지 않았어요')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={warm.tan} />
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
    borderTopColor: warm.sand,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: warm.sand,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontFamily: fonts.bold, fontSize: 26, color: warm.black },
  // 홈 카드와 같은 모양 (바탕 + 갈색 그림자)
  card: {
    gap: spacing.sm + 4,
    padding: 20,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  cardLabel: { fontFamily: fonts.semibold, fontSize: 13, color: warm.tan },
  writing: { color: warm.clay },
  todo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: warm.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: warm.ink },
  todoBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todoTitle: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: warm.black,
  },
  todoDone: { color: warm.tan, textDecorationLine: 'line-through' },
  todoTime: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.ink,
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.6 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: warm.tan },
  error: { fontSize: 13, color: colors.danger },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: warm.tan,
    textAlign: 'center',
  },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  thumb: { width: 56, height: 56, borderRadius: 7 },
  entryBody: { flex: 1, gap: 4 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summary: { fontFamily: fonts.regular, fontSize: 15, color: warm.black },
});
