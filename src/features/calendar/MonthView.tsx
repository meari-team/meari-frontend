import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { dayStateOf, monthGrid, type YearMonth } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  month: YearMonth;
  today: string;
  entries: EntrySummaryDto[];
  // 날짜별 일정 수
  scheduleCounts?: Map<string, number>;
  selected?: string | null;
  onPressDay: (date: string, hasEntry: boolean) => void;
};

// 월간 격자. 확정 = 채운 칸 + 카테고리 색 점, 확정 전 = 점선(작성 중), 미래 = 흐리게
// 일정이 있는 날은 숫자 아래 작은 막대. 미래 날짜도 눌러 일정을 볼 수 있다
export function MonthView({
  month,
  today,
  entries,
  scheduleCounts,
  selected,
  onPressDay,
}: Props) {
  const byDate = new Map(entries.map((e) => [e.date, e]));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={w}
            style={[
              styles.weekday,
              i === 0 && styles.sunday,
              i === 6 && styles.saturday,
            ]}
          >
            {w}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((date, di) => {
            if (!date) return <View key={di} style={styles.cell} />;
            const entry = byDate.get(date);
            const state = dayStateOf(date, today, entry?.status);
            const day = Number(date.slice(8));
            const schedules = scheduleCounts?.get(date) ?? 0;
            return (
              <Pressable
                key={date}
                testID={`day-${date}`}
                accessibilityRole="button"
                accessibilityLabel={`${day}일${
                  state === 'confirmed'
                    ? ', 일기 있음'
                    : state === 'writing'
                      ? ', 작성 중'
                      : ''
                }${schedules > 0 ? `, 일정 ${schedules}개` : ''}`}
                accessibilityState={{ selected: selected === date }}
                onPress={() => onPressDay(date, !!entry)}
                style={({ pressed }) => [
                  styles.cell,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.day,
                    state === 'confirmed' && styles.confirmed,
                    state === 'writing' && styles.writing,
                    date === today && styles.today,
                    selected === date && styles.selected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      state === 'future' && styles.futureText,
                      state === 'confirmed' && styles.confirmedText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scheduleBar,
                    schedules > 0 && styles.hasSchedule,
                  ]}
                  testID={schedules > 0 ? `day-schedule-${date}` : undefined}
                />
                <View style={styles.dots}>
                  {(entry?.categoryColors ?? []).slice(0, 3).map((c) => (
                    <View
                      key={c}
                      style={[styles.dot, { backgroundColor: c }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <View style={[styles.legendBox, styles.confirmed]} />
        <Text style={styles.legendText}>확정</Text>
        <View style={[styles.legendBox, styles.writing]} />
        <Text style={styles.legendText}>작성 중</Text>
        <View style={[styles.legendBar, styles.hasSchedule]} />
        <Text style={styles.legendText}>일정</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  sunday: { color: colors.danger },
  saturday: { color: colors.primary },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 52 },
  pressed: { opacity: 0.6 },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirmed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  writing: { borderStyle: 'dashed', borderColor: colors.textMuted },
  today: { borderColor: colors.primary, borderStyle: 'solid' },
  selected: { borderColor: colors.text, borderWidth: 2, borderStyle: 'solid' },
  dayText: { fontSize: 14, color: colors.text },
  confirmedText: { color: colors.primary, fontWeight: '700' },
  futureText: { color: colors.disabled },
  scheduleBar: { width: 14, height: 3, borderRadius: 2, marginTop: 3 },
  hasSchedule: { backgroundColor: colors.warning },
  legendBar: { width: 14, height: 3, borderRadius: 2, marginLeft: spacing.sm },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  legendText: { fontSize: 12, color: colors.textMuted },
});
