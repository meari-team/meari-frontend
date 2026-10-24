import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEntriesRange } from '@/api/entries';
import { useSchedules } from '@/api/schedules';
import { errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { DayPanel } from '@/features/calendar/DayPanel';
import { ListView } from '@/features/calendar/ListView';
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
import { countByDate } from '@/lib/schedule';
import { colors, radius, spacing } from '@/theme';

type Mode = 'month' | 'year' | 'list';

const isMode = (v: unknown): v is Mode =>
  v === 'month' || v === 'year' || v === 'list';

const MODE_LABEL: Record<Mode, string> = {
  month: '월간',
  year: '연간',
  list: '목록',
};

// 캘린더: 월간(일기·체크리스트 색) / 연간(대표 사진 보관함) / 목록(전체 일기 최신순) (prd.md §7-3)
export default function CalendarScreen() {
  const today = todayKst();
  // 홈의 "전체 보기"는 ?mode=list로 연다. at은 같은 모드로 다시 열 때도 바뀌게 하는 값
  const params = useLocalSearchParams<{ mode?: string; at?: string }>();
  const [mode, setMode] = useState<Mode>(() =>
    isMode(params.mode) ? params.mode : 'month',
  );
  // 렌더 중에 파라미터가 바뀐 것을 보고 모드를 맞춘다 (effect 대신)
  const [seenAt, setSeenAt] = useState(params.at);
  if (params.at !== seenAt) {
    setSeenAt(params.at);
    if (isMode(params.mode)) setMode(params.mode);
  }
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(today));
  const [year, setYear] = useState(() => yearMonthOf(today).year);

  const range = mode === 'month' ? monthRange(month) : yearRange(year);
  const list = useEntriesRange(range.from, range.to);
  const monthSpan = monthRange(month);
  // 일정은 월간에서만 쓴다. 실패해도 캘린더는 그대로 보여 준다 (날짜 패널에서 다시 시도)
  const schedules = useSchedules(monthSpan.from, monthSpan.to);
  const [selected, setSelected] = useState<string>(today);

  const canNext =
    mode === 'month'
      ? canGoNextMonth(month, today)
      : year < yearMonthOf(today).year; // 연간 보관함은 사진(일기)만이라 올해까지
  const title =
    mode === 'month' ? `${month.year}년 ${month.month}월` : `${year}년`;
  const move = (delta: number) =>
    mode === 'month' ? moveMonth(delta) : setYear((y) => y + delta);

  // 날짜를 누르면 아래 패널에 그날 일정과 일기 보기/쓰기가 나온다
  const selectDay = (date: string) => setSelected(date);
  const moveMonth = (delta: number) => {
    const next = shiftMonth(month, delta);
    // 오늘이 있는 달로 오면 오늘, 아니면 그 달 1일을 고른다
    const span = monthRange(next);
    setMonth(next);
    setSelected(today >= span.from && today <= span.to ? today : span.from);
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
          scheduleCounts={countByDate(schedules.data ?? [])}
          selected={selected}
          onPressDay={selectDay}
        />
        <DayPanel
          key={selected}
          date={selected}
          today={today}
          entry={list.data.find((e) => e.date === selected)}
        />
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

  const tabs = (
    <View style={styles.tabs} accessibilityRole="tablist">
      {(['month', 'year', 'list'] as const).map((m) => (
        <Pressable
          key={m}
          testID={`calendar-mode-${m}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m }}
          aria-selected={mode === m}
          onPress={() => setMode(m)}
          style={[styles.tab, mode === m && styles.tabSelected]}
        >
          <Text style={[styles.tabText, mode === m && styles.tabTextSelected]}>
            {MODE_LABEL[m]}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // 목록은 무한 스크롤이라 FlatList가 화면 스크롤을 맡는다 (ScrollView 안에 넣지 않는다)
  if (mode === 'list') {
    return (
      <View style={styles.listScreen}>
        <ListView header={tabs} />
      </View>
    );
  }

  return (
    <Screen edges={[]}>
      {tabs}

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
  listScreen: { flex: 1, backgroundColor: colors.background },
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
});
