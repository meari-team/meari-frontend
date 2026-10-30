import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntry, type EntrySummaryDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import {
  useAvailability,
  useCreateSession,
  type AvailabilityPresetDto,
  type ChatSessionDto,
} from '@/api/past-self';
import { MonthView } from '@/features/calendar/MonthView';
import { entryPreviewText } from '@/features/home/logic';
import { shiftMonth, yearMonthOf, type YearMonth } from '@/lib/calendar';
import { colors, fonts, spacing, warm } from '@/theme';
import {
  PRESET_LABELS,
  PRESET_SHORT,
  dayPosition,
  dotState,
  lastConfirmedOnOrBefore,
  pastSelfTitle,
  relativeTime,
  selfBarLine,
  shortKoreanDate,
  timelineMonths,
  type DotState,
} from './logic';

const chatHref = (s: ChatSessionDto) =>
  ({
    pathname: '/past-self/[sessionId]',
    params: { sessionId: s.id, anchorDate: s.anchorDate },
  }) as const;

// 1주·1개월·3개월·6개월·1년 전을 한 줄 탭으로. 고른 것만 밑줄, 기록이 모자란 시점은 흐리게(누를 수 없음)
export function PresetTabs({
  presets,
  anchor,
  onPick,
}: {
  presets: AvailabilityPresetDto[];
  anchor: string;
  onPick: (date: string) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {presets.map((p) => {
        const on = p.available && p.anchorDate === anchor;
        return (
          <Pressable
            key={p.preset}
            testID={`preset-${p.preset}`}
            accessibilityRole="tab"
            accessibilityLabel={`${PRESET_LABELS[p.preset]}의 나`}
            accessibilityState={{ disabled: !p.available, selected: on }}
            aria-selected={on}
            disabled={!p.available}
            onPress={() => onPick(p.anchorDate)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Text
              style={[
                styles.tabText,
                on && styles.tabTextOn,
                !p.available && styles.tabTextOff,
              ]}
              numberOfLines={1}
            >
              {PRESET_SHORT[p.preset]}
            </Text>
            <View style={[styles.tabLine, on && styles.tabLineOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

// 그날의 나 카드: 고른 기준일의 나 · 기록 수 - 그때의 마지막 일기 한 줄 → [대화하기]
export function SelfBar({
  anchor,
  entries,
}: {
  anchor: string;
  entries: EntrySummaryDto[];
}) {
  const availability = useAvailability(anchor);
  const create = useCreateSession();
  const last = lastConfirmedOnOrBefore(entries, anchor);
  const lastText = useLastText(last);
  const a = availability.data;

  const start = () =>
    create.mutate(anchor, {
      onSuccess: (s) => router.push(chatHref(s)),
    });

  let line;
  if (availability.isPending) line = '기록을 세는 중…';
  else if (availability.isError) line = errorMessage(availability.error);
  else line = selfBarLine(a!, lastText);

  return (
    <View testID="self-bar" style={styles.selfCard}>
      <View style={styles.bar}>
        <Pressable
          style={({ pressed }) => [styles.barText, pressed && styles.pressed]}
          disabled={!last}
          accessibilityRole={last ? 'button' : undefined}
          accessibilityLabel={
            last ? `${shortKoreanDate(last.date)} 일기 보기` : undefined
          }
          onPress={() => last && router.push(`/entry/${last.date}`)}
        >
          <Text style={styles.barTitle} numberOfLines={1}>
            {pastSelfTitle(anchor)}
          </Text>
          <Text
            style={[styles.barLine, a && !a.available && styles.barLineOff]}
            numberOfLines={1}
            testID="self-count"
          >
            {line}
          </Text>
        </Pressable>
        <Pressable
          testID="start-chat"
          accessibilityRole="button"
          accessibilityLabel={`${pastSelfTitle(anchor)}와 대화하기`}
          accessibilityState={{ disabled: !a?.available || create.isPending }}
          disabled={!a?.available || create.isPending}
          onPress={start}
          style={({ pressed }) => [
            styles.talk,
            (!a?.available || create.isPending) && styles.talkOff,
            pressed && styles.pressed,
          ]}
        >
          {create.isPending ? (
            <ActivityIndicator color={warm.field} />
          ) : (
            <Text style={styles.talkText}>대화하기</Text>
          )}
        </Pressable>
      </View>
      {create.isError ? (
        <Text style={styles.error}>{errorMessage(create.error)}</Text>
      ) : null}
    </View>
  );
}

// 그때의 마지막 일기 첫 줄 (요약이 없으면 상세를 읽어 본문 앞부분)
function useLastText(entry: EntrySummaryDto | null): string | null {
  const detail = useEntry(entry?.date ?? '', {
    enabled: !!entry && !entry.summary,
  });
  if (!entry) return null;
  return entry.summary ?? (detail.data ? entryPreviewText(detail.data) : null);
}

// 월별 기록 흐름 카드. 점 = 하루 일기, 눌러서 기준일로. 기준일 이후 점은 흐리게(모래색).
// 기준일에는 세로 표시와 "9/25"를 붙인다
export function Timeline({
  entries,
  today,
  anchor,
  onPick,
  onPickOther,
}: {
  entries: EntrySummaryDto[];
  today: string;
  anchor: string;
  onPick: (date: string) => void;
  onPickOther: () => void;
}) {
  const months = timelineMonths(entries, today);
  const anchorLabel = `${Number(anchor.slice(5, 7))}/${Number(anchor.slice(8))}`;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>기록 흐름</Text>
      <Text style={styles.cardHint}>
        점을 누르면 그날의 나로 바뀌어요.{'\n'}흐린 점은 그때의 나가 모르는
        기록이에요.
      </Text>
      {months.length === 0 ? (
        <Text style={styles.muted}>아직 쓴 일기가 없어요.</Text>
      ) : (
        <View style={styles.rows} testID="timeline">
          {months.map((m) => {
            const here = anchor.startsWith(m.key);
            const anchorLeft =
              `${dayPosition(Number(anchor.slice(8)), m.days) * 100}%` as const;
            return (
              <View key={m.key} style={styles.row}>
                <Text style={[styles.month, here && styles.monthOn]}>
                  {m.label}
                </Text>
                <View style={styles.track}>
                  <View style={styles.rail} />
                  {m.dots.map((d) => (
                    <Pressable
                      key={d.date}
                      testID={`dot-${d.date}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${shortKoreanDate(d.date)} 일기, 이날의 나로`}
                      hitSlop={6}
                      onPress={() => onPick(d.date)}
                      style={[
                        styles.dot,
                        DOT_STYLE[dotState(d, anchor)],
                        { left: `${dayPosition(d.day, m.days) * 100}%` },
                      ]}
                    />
                  ))}
                  {here ? (
                    <>
                      <View
                        pointerEvents="none"
                        style={[styles.marker, { left: anchorLeft }]}
                      />
                      <Text
                        pointerEvents="none"
                        style={[styles.markerLabel, { left: anchorLeft }]}
                      >
                        {anchorLabel}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        testID="pick-other-day"
        onPress={onPickOther}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkText}>캘린더에서 고르기</Text>
      </Pressable>
    </View>
  );
}

// 일기 없는 날도 고를 수 있는 달력 시트. 오늘 이후는 고를 수 없다
export function DateSheet({
  visible,
  today,
  anchor,
  entries,
  onPick,
  onClose,
}: {
  visible: boolean;
  today: string;
  anchor: string;
  entries: EntrySummaryDto[];
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(anchor));
  const thisMonth = yearMonthOf(today);
  const atLatest =
    month.year === thisMonth.year && month.month === thisMonth.month;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setMonth(yearMonthOf(anchor))}
    >
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
      />
      <View
        style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}
        testID="date-sheet"
      >
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            hitSlop={8}
            onPress={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.sheetTitle}>
            {month.year}. {month.month}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            accessibilityState={{ disabled: atLatest }}
            disabled={atLatest}
            hitSlop={8}
            onPress={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <Text style={[styles.arrow, atLatest && styles.arrowOff]}>›</Text>
          </Pressable>
        </View>
        <Text style={styles.muted}>그날까지의 기록만 아는 나와 대화해요.</Text>
        <MonthView
          month={month}
          today={today}
          entries={entries}
          selected={anchor}
          onPressDay={(date, inMonth) => {
            if (date > today) return;
            if (!inMonth) return setMonth(yearMonthOf(date));
            onPick(date);
          }}
          onSwipe={(delta) => {
            if (delta > 0 && atLatest) return;
            setMonth((m) => shiftMonth(m, delta));
          }}
        />
      </View>
    </Modal>
  );
}

// 대화 목록 줄들: "M월 D일까지의 나 · 언제" + 마지막 메시지 한 줄 (최근 대화·지난 대화 공용)
export function SessionRows({ sessions }: { sessions: ChatSessionDto[] }) {
  return sessions.map((s) => (
    <Pressable
      key={s.id}
      testID={`session-${s.id}`}
      accessibilityRole="button"
      onPress={() => router.push(chatHref(s))}
      style={({ pressed }) => [
        styles.session,
        styles.sessionDivider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.sessionTop}>
        <Text style={styles.sessionTitle}>{pastSelfTitle(s.anchorDate)}</Text>
        <Text style={styles.sessionTime}>
          {relativeTime(s.lastMessageAt ?? s.createdAt)}
        </Text>
      </View>
      <Text style={styles.sessionPreview} numberOfLines={3}>
        {s.lastMessagePreview ?? '아직 메시지가 없어요'}
      </Text>
    </Pressable>
  ));
}

const DOT = 12;
const TRACK = 20;

const DOT_STYLE: Record<DotState, object> = {
  known: { backgroundColor: warm.brown },
  draft: { borderWidth: 1.5, borderColor: warm.sand },
  unknown: { backgroundColor: warm.sand },
};

// 홈과 같은 종이 카드
const card = {
  padding: 20,
  borderRadius: 10,
  backgroundColor: warm.field,
  shadowColor: warm.brown,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 3.5,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: warm.tan },
  error: { fontSize: 14, color: colors.danger, marginTop: 8 },

  // 시점 탭: 아래 모래색 줄 위에 고른 탭만 진갈색 밑줄
  tabs: {
    flexDirection: 'row',
    marginTop: 7,
    borderBottomWidth: 2,
    borderBottomColor: warm.sand,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.tan },
  tabTextOn: { color: warm.black },
  tabTextOff: { color: warm.sand },
  tabLine: {
    alignSelf: 'stretch',
    height: 2,
    marginTop: 10,
    marginBottom: -2,
    backgroundColor: 'transparent',
  },
  tabLineOn: { backgroundColor: warm.ink },

  card: { ...card, marginTop: 7 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  cardHint: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: warm.brown,
  },
  rows: { gap: 11, marginTop: 19, paddingRight: 22 },
  row: { flexDirection: 'row', alignItems: 'center' },
  month: {
    width: 66,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: warm.tan,
  },
  monthOn: { color: warm.ink },
  track: { flex: 1, height: TRACK, justifyContent: 'center' },
  rail: { height: 2, backgroundColor: warm.sand },
  dot: {
    position: 'absolute',
    top: (TRACK - DOT) / 2,
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    borderRadius: DOT / 2,
  },
  marker: {
    position: 'absolute',
    top: 3,
    width: 2,
    height: 14,
    marginLeft: 6,
    backgroundColor: warm.brown,
  },
  markerLabel: {
    position: 'absolute',
    top: -14,
    width: 40,
    marginLeft: -13,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 10,
    color: warm.brown,
  },
  link: { alignSelf: 'center', padding: 10, marginTop: 8, marginBottom: -10 },
  linkText: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },

  selfCard: { ...card, marginTop: 2 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barText: { flex: 1, gap: 8 },
  barTitle: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  barLine: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  barLineOff: { color: warm.sunday },
  talk: {
    width: 109,
    height: 45,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warm.tan,
  },
  talkOff: { opacity: 0.45 },
  talkText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.field },

  backdrop: { flex: 1, backgroundColor: 'rgba(74,52,42,0.3)' },
  sheet: {
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: warm.background,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: warm.sand,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: warm.black },
  arrow: {
    fontSize: 28,
    lineHeight: 30,
    color: warm.ink,
    paddingHorizontal: 8,
  },
  arrowOff: { color: warm.sand },

  // 시안 "지난 대화": 제목 18 · 미리보기 3줄 · 모래색 굵은 구분선
  session: { gap: 10, paddingTop: 18, paddingBottom: 16 },
  sessionDivider: { borderBottomWidth: 1.5, borderBottomColor: warm.sand },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  sessionTitle: { fontFamily: fonts.semibold, fontSize: 18, color: warm.black },
  sessionTime: { fontFamily: fonts.medium, fontSize: 11, color: warm.tan },
  sessionPreview: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: warm.brown,
  },
});
