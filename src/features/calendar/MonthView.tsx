import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { monthGridFilled, type YearMonth } from '@/lib/calendar';
import { colors, spacing } from '@/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  month: YearMonth;
  today: string;
  entries: EntrySummaryDto[];
  // 날짜별 일정 수
  scheduleCounts?: Map<string, number>;
  selected?: string | null;
  // 앞뒤 달 날짜를 누르면 inMonth=false (그 달로 넘어간다)
  onPressDay: (date: string, inMonth: boolean) => void;
  // 좌우로 밀면 -1(이전 달) / 1(다음 달)
  onSwipe?: (delta: number) => void;
};

// 월간 격자: 일요일 빨강·토요일 파랑, 앞뒤 달은 흐리게, 오늘 = 채운 원, 고른 날 = 연한 원.
// 숫자 아래 점: 일기(확정 = 보라, 작성 중 = 회색) · 일정(주황)
export function MonthView({
  month,
  today,
  entries,
  scheduleCounts,
  selected,
  onPressDay,
  onSwipe,
}: Props) {
  const byDate = new Map(entries.map((e) => [e.date, e]));

  // 좌우로 충분히(가로 50 이상, 세로의 2배 이상) 밀었다 떼면 달을 넘긴다.
  // 터치 이벤트만 보므로 세로 스크롤·날짜 누르기는 그대로 동작한다
  const start = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: GestureResponderEvent) => {
    start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };
  const onTouchEnd = (e: GestureResponderEvent) => {
    if (!start.current) return;
    const dx = e.nativeEvent.pageX - start.current.x;
    const dy = e.nativeEvent.pageY - start.current.y;
    start.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2)
      onSwipe?.(dx < 0 ? 1 : -1);
  };

  return (
    <View
      style={styles.wrap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      testID="month-grid"
    >
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
      {monthGridFilled(month).map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map(({ date, inMonth }, di) => {
            const entry = byDate.get(date);
            const day = Number(date.slice(8));
            const schedules = scheduleCounts?.get(date) ?? 0;
            const isToday = date === today;
            const isSelected = selected === date && !isToday;
            const confirmed = entry?.status === 'CONFIRMED';
            return (
              <Pressable
                key={date}
                testID={`day-${date}`}
                accessibilityRole="button"
                accessibilityLabel={`${Number(date.slice(5, 7))}월 ${day}일${
                  entry ? (confirmed ? ', 일기 있음' : ', 작성 중') : ''
                }${schedules > 0 ? `, 일정 ${schedules}개` : ''}`}
                accessibilityState={{ selected: selected === date }}
                onPress={() => onPressDay(date, inMonth)}
                style={({ pressed }) => [
                  styles.cell,
                  !inMonth && styles.outside,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.day,
                    isSelected && styles.selected,
                    isToday && styles.today,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      di === 0 && styles.sunday,
                      di === 6 && styles.saturday,
                      isToday && styles.todayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {entry ? (
                    <View
                      testID={`day-entry-${date}`}
                      style={[
                        styles.dot,
                        confirmed ? styles.entryDot : styles.writingDot,
                      ]}
                    />
                  ) : null}
                  {schedules > 0 ? (
                    <View
                      testID={`day-schedule-${date}`}
                      style={[styles.dot, styles.scheduleDot]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <View style={[styles.dot, styles.entryDot]} />
        <Text style={styles.legendText}>일기</Text>
        <View style={[styles.dot, styles.writingDot, styles.legendGap]} />
        <Text style={styles.legendText}>작성 중</Text>
        <View style={[styles.dot, styles.scheduleDot, styles.legendGap]} />
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  sunday: { color: colors.danger },
  saturday: { color: colors.primary },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 60 },
  outside: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.surfaceMuted },
  today: { backgroundColor: colors.text },
  dayText: { fontSize: 16, fontWeight: '500', color: colors.text },
  todayText: { color: colors.surface, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 4, height: 6, marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  entryDot: { backgroundColor: colors.primary },
  writingDot: { backgroundColor: colors.disabled },
  scheduleDot: { backgroundColor: colors.warning },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  legendGap: { marginLeft: spacing.sm },
  legendText: { fontSize: 12, color: colors.textMuted },
});
