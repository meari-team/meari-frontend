import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEntriesRange } from '@/api/entries';
import { useSchedules, type ScheduleDto } from '@/api/schedules';
import { errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { AddMenu } from '@/features/calendar/AddMenu';
import { DayPanel } from '@/features/calendar/DayPanel';
import { ListView } from '@/features/calendar/ListView';
import { MonthPicker } from '@/features/calendar/MonthPicker';
import { MonthView } from '@/features/calendar/MonthView';
import { ScheduleSheet } from '@/features/calendar/ScheduleSheet';
import { YearView } from '@/features/calendar/YearView';
import {
  canGoNextMonth,
  monthGridFilled,
  monthRange,
  shiftMonth,
  yearMonthOf,
  yearRange,
  type YearMonth,
} from '@/lib/calendar';
import { todayKst } from '@/lib/dates';
import { countByDate } from '@/lib/schedule';
import { fonts, radius, spacing, warm } from '@/theme';

type Mode = 'month' | 'year' | 'list';

const isMode = (v: unknown): v is Mode =>
  v === 'month' || v === 'year' || v === 'list';

// 시안 아이콘 (Phosphor: CalendarBlank · Images · List)
const MODES: {
  mode: Mode;
  label: string;
  icon: ImageSourcePropType;
  size: number;
}[] = [
  {
    mode: 'month',
    label: '월간',
    icon: require('../../../../assets/images/calendar/month.png'),
    size: 24,
  },
  {
    mode: 'year',
    label: '연간 캘린더',
    icon: require('../../../../assets/images/calendar/images.png'),
    size: 27,
  },
  {
    mode: 'list',
    label: '전체 목록',
    icon: require('../../../../assets/images/calendar/list.png'),
    size: 24,
  },
];

// 아래 떠 있는 버튼(오늘·+)에 내용이 가리지 않게 남기는 여백
const FLOATING_SPACE = 80;

// 캘린더: 월간(일기·일정 점 + 날짜 패널) / 연간(대표 사진 보관함) / 목록(전체 일기 최신순) (prd.md §7-3)
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
  // 사진·전체 목록을 보다가 하단 캘린더 탭을 다시 누르면 월간 캘린더로 돌아온다
  const navigation = useNavigation();
  useEffect(() => {
    const tabs = navigation.getParent();
    if (!tabs) return;
    return tabs.addListener('tabPress' as never, () => {
      if (navigation.isFocused()) setMode('month');
    });
  }, [navigation]);
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(today));
  const [year, setYear] = useState(() => yearMonthOf(today).year);
  const [selected, setSelected] = useState<string>(today);
  const [picking, setPicking] = useState(false);
  // 연간 캘린더는 오래된 달부터라, 올해를 열면 맨 아래(최근 달)로 내려 둔다
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // 일정 시트: 열려 있으면 날짜, editing이 있으면 수정
  const [sheet, setSheet] = useState<{
    date: string;
    editing: ScheduleDto | null;
  } | null>(null);

  // 월간은 앞뒤 달 칸까지 점을 찍으므로 격자 전체 기간을 읽는다
  const weeks = monthGridFilled(month);
  const gridSpan = {
    from: weeks[0][0].date,
    to: weeks[weeks.length - 1][6].date,
  };
  const range = mode === 'month' ? gridSpan : yearRange(year);
  const list = useEntriesRange(range.from, range.to);
  // 일정은 월간에서만 쓴다. 실패해도 캘린더는 그대로 보여 준다 (날짜 패널에서 다시 시도)
  const schedules = useSchedules(gridSpan.from, gridSpan.to);

  const yearEntries = mode === 'year' ? list.data : undefined;
  useEffect(() => {
    if (!yearEntries || year !== yearMonthOf(today).year) return;
    // 그려진 다음 맨 아래로
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      50,
    );
    return () => clearTimeout(id);
  }, [yearEntries, year, today]);

  const goMonth = (next: YearMonth, select?: string) => {
    if (!canGoNextMonth(next, today)) return;
    // 고른 날이 없으면: 오늘이 있는 달이면 오늘, 아니면 그 달 1일
    const span = monthRange(next);
    setMonth(next);
    setSelected(
      select ?? (today >= span.from && today <= span.to ? today : span.from),
    );
  };
  const pressDay = (date: string, inMonth: boolean) =>
    inMonth ? setSelected(date) : goMonth(yearMonthOf(date), date);
  const goToday = () => {
    setMode('month');
    goMonth(yearMonthOf(today), today);
  };

  const header = (
    <View style={styles.header}>
      {mode === 'month' ? (
        <Pressable
          testID="calendar-title"
          accessibilityRole="button"
          accessibilityLabel={`${month.year}년 ${month.month}월, 다른 달 고르기`}
          hitSlop={8}
          onPress={() => setPicking(true)}
          style={styles.titleButton}
        >
          <Text style={styles.title}>
            {month.year}.{month.month}
          </Text>
          <Ionicons name="chevron-down" size={18} color={warm.black} />
        </Pressable>
      ) : mode === 'year' ? (
        <View style={styles.titleButton}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 해"
            hitSlop={12}
            onPress={() => setYear((y) => y - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={warm.black} />
          </Pressable>
          <Text style={styles.title}>{year}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 해"
            // 연간 보관함은 사진(일기)만이라 올해까지
            accessibilityState={{ disabled: year >= yearMonthOf(today).year }}
            disabled={year >= yearMonthOf(today).year}
            hitSlop={12}
            onPress={() => setYear((y) => y + 1)}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={year >= yearMonthOf(today).year ? warm.sand : warm.black}
            />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.title}>전체 일기</Text>
      )}

      <View style={styles.modes} accessibilityRole="tablist">
        {MODES.map((m) => (
          <Pressable
            key={m.mode}
            testID={`calendar-mode-${m.mode}`}
            accessibilityRole="tab"
            accessibilityLabel={m.label}
            accessibilityState={{ selected: mode === m.mode }}
            aria-selected={mode === m.mode}
            hitSlop={6}
            onPress={() => setMode(m.mode)}
            style={[styles.modeButton, mode === m.mode && styles.modeOn]}
          >
            <Image
              source={m.icon}
              style={{ width: m.size, height: m.size, tintColor: warm.black }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  // 목록은 무한 스크롤이라 FlatList가 화면 스크롤을 맡는다 (ScrollView 안에 넣지 않는다)
  if (mode === 'list') {
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ListView header={header} />
      </SafeAreaView>
    );
  }

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
          onPressDay={pressDay}
          onSwipe={(delta) => goMonth(shiftMonth(month, delta))}
        />
        <DayPanel
          key={selected}
          date={selected}
          today={today}
          entry={list.data.find((e) => e.date === selected)}
          schedules={schedules}
          onEditSchedule={(s) => setSheet({ date: selected, editing: s })}
        />
        <View style={{ height: FLOATING_SPACE }} />
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
        year={year}
        entries={list.data}
        onPressEntry={(date) => router.push(`/entry/${date}`)}
      />
    );
  }

  const showingToday =
    month.year === yearMonthOf(today).year &&
    month.month === yearMonthOf(today).month &&
    selected === today;

  return (
    <View style={styles.flex}>
      <Screen
        edges={['top']}
        backgroundColor={warm.background}
        scrollRef={scrollRef}
      >
        {header}
        {body}
      </Screen>

      {mode === 'month' ? (
        <>
          {!showingToday ? (
            <View style={styles.todayWrap} pointerEvents="box-none">
              <Pressable
                testID="calendar-today"
                accessibilityRole="button"
                accessibilityLabel="오늘로 이동"
                onPress={goToday}
                style={({ pressed }) => [
                  styles.todayPill,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.todayText}>오늘</Text>
                <Ionicons name="chevron-forward" size={16} color={warm.tan} />
              </Pressable>
            </View>
          ) : null}
          <AddMenu
            date={selected}
            today={today}
            entryStatus={list.data?.find((e) => e.date === selected)?.status}
            onAddSchedule={() => setSheet({ date: selected, editing: null })}
          />
        </>
      ) : null}

      <MonthPicker
        visible={picking}
        value={month}
        today={today}
        onClose={() => setPicking(false)}
        onSelect={(ym) => {
          setPicking(false);
          goMonth(ym);
        }}
      />
      <ScheduleSheet
        date={sheet?.date ?? null}
        editing={sheet?.editing}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: warm.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  titleButton: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: warm.black },
  // 시안: 아이콘 셋, 고른 것만 모래색 동그라미(32) 바탕
  modes: { flexDirection: 'row', gap: 6 },
  modeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOn: { backgroundColor: warm.sand },
  pressed: { opacity: 0.7 },
  todayWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md + 6,
    alignItems: 'center',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm + 2,
    paddingLeft: spacing.md + 2,
    paddingRight: spacing.sm + 4,
    borderRadius: radius.pill,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
  },
  todayText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.ink },
});
