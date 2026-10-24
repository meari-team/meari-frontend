import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEntriesRange } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { MonthView } from '@/features/calendar/MonthView';
import { YearView } from '@/features/calendar/YearView';
import {
  canGoNextMonth,
  monthRange,
  shiftMonth,
  yearMonthOf,
  yearRange,
  type YearMonth,
} from '@/lib/calendar';
import { todayKst } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

type Mode = 'month' | 'year';

// 캘린더: 월간(일기·체크리스트 색) / 연간(대표 사진 보관함) (prd.md §7-3)
export default function CalendarScreen() {
  const today = todayKst();
  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(today));
  const [year, setYear] = useState(() => yearMonthOf(today).year);

  const range = mode === 'month' ? monthRange(month) : yearRange(year);
  const list = useEntriesRange(range.from, range.to);

  const canNext =
    mode === 'month'
      ? canGoNextMonth(month, today)
      : year < yearMonthOf(today).year;
  const title =
    mode === 'month' ? `${month.year}년 ${month.month}월` : `${year}년`;
  const move = (delta: number) =>
    mode === 'month'
      ? setMonth((m) => shiftMonth(m, delta))
      : setYear((y) => y + delta);

  const openDay = (date: string, hasEntry: boolean) => {
    if (hasEntry) router.push(`/entry/${date}`);
    else router.push(`/today?date=${date}`); // 기록 없는 지난 날 → 그날 일기 쓰기
  };

  let body;
  if (list.isPending) {
    body = <StateView status="loading" />;
  } else if (list.isError) {
    body = (
      <StateView
        status="error"
        message={errorMessage(list.error)}
        onRetry={() => void list.refetch()}
      />
    );
  } else if (mode === 'month') {
    body = (
      <>
        <MonthView
          month={month}
          today={today}
          entries={list.data}
          onPressDay={openDay}
        />
        {list.data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>이 달에는 아직 기록이 없어요.</Text>
            <Button
              title="첫 기록을 남겨 보세요"
              variant="ghost"
              onPress={() => router.push('/today')}
            />
          </View>
        ) : null}
      </>
    );
  } else if (list.data.length === 0) {
    body = (
      <StateView
        status="empty"
        message={`${year}년에는 아직 기록이 없어요.`}
        actionLabel="오늘 일기 쓰기"
        onAction={() => router.push('/today')}
      />
    );
  } else {
    body = (
      <YearView
        entries={list.data}
        onPressEntry={(date) => router.push(`/entry/${date}`)}
      />
    );
  }

  return (
    <Screen edges={[]}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['month', 'year'] as const).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
            onPress={() => setMode(m)}
            style={[styles.tab, mode === m && styles.tabSelected]}
          >
            <Text
              style={[styles.tabText, mode === m && styles.tabTextSelected]}
            >
              {m === 'month' ? '월간' : '연간'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'month' ? '이전 달' : '이전 해'}
          hitSlop={12}
          onPress={() => move(-1)}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'month' ? '다음 달' : '다음 해'}
          accessibilityState={{ disabled: !canNext }}
          hitSlop={12}
          disabled={!canNext}
          onPress={() => move(1)}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canNext ? colors.text : colors.disabled}
          />
        </Pressable>
      </View>

      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
  },
  tabSelected: { backgroundColor: colors.surface },
  tabText: { fontSize: 14, color: colors.textMuted },
  tabTextSelected: { color: colors.text, fontWeight: '700' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  empty: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
