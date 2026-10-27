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
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { MonthView } from '@/features/calendar/MonthView';
import { entryPreviewText } from '@/features/home/logic';
import { shiftMonth, yearMonthOf, type YearMonth } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';
import {
  PRESET_LABELS,
  PRESET_SHORT,
  dayPosition,
  dotState,
  lastConfirmedOnOrBefore,
  pastSelfTitle,
  recentSessionsView,
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
            style={({ pressed }) => [
              styles.tab,
              !p.available && styles.tabOff,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.tabText, on && styles.tabTextOn]}
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

// 화면 아래 고정 바: 고른 기준일의 나 · 기록 수 · 그때의 마지막 일기 한 줄 → [대화하기]
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
    <View testID="self-bar">
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
            <ActivityIndicator color={colors.primaryText} />
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

const DOT = 10;

// 월별 기록 흐름. 점 = 하루 일기, 눌러서 기준일로. 기준일 이후 점은 흐리게
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
  return (
    <Section
      title="기록 흐름"
      hint="점을 누르면 그날의 나로 바뀌어요. 흐린 점은 그때의 나가 모르는 기록이에요."
      action={{
        label: '다른 날 고르기',
        onPress: onPickOther,
        testID: 'pick-other-day',
      }}
    >
      {months.length === 0 ? (
        <Text style={styles.muted}>아직 쓴 일기가 없어요.</Text>
      ) : (
        <View style={styles.rows} testID="timeline">
          {months.map((m) => {
            const here = anchor.startsWith(m.key);
            return (
              <View key={m.key} style={styles.row}>
                <Text style={[styles.month, here && styles.monthOn]}>
                  {m.label}
                </Text>
                <View style={styles.track}>
                  <View style={styles.rail} />
                  {here ? (
                    <View
                      style={[
                        styles.marker,
                        {
                          left: `${dayPosition(Number(anchor.slice(8)), m.days) * 100}%`,
                        },
                      ]}
                    />
                  ) : null}
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
                        d.date === anchor && styles.dotOn,
                        { left: `${dayPosition(d.day, m.days) * 100}%` },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.here}>{here ? '◀ 여기' : ''}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Section>
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

// 최근 대화: 기준일 제목 · 마지막 메시지 · 시간
// 최근 대화: 3개까지만, 더 있으면 "전체 보기" → 지난 대화 화면
export function RecentSessions({
  sessions,
  pending,
  error,
  onRetry,
}: {
  sessions: ChatSessionDto[] | undefined;
  pending: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const view = sessions ? recentSessionsView(sessions) : null;
  let body;
  if (pending) {
    body = <ActivityIndicator color={colors.primary} />;
  } else if (error || !view) {
    body = (
      <View style={styles.failed}>
        <Text style={styles.error}>{errorMessage(error)}</Text>
        <Button title="다시 시도" variant="ghost" onPress={onRetry} />
      </View>
    );
  } else if (view.shown.length === 0) {
    body = <Text style={styles.muted}>아직 나눈 대화가 없어요.</Text>;
  } else {
    body = <SessionRows sessions={view.shown} />;
  }
  return (
    <Section
      title="최근 대화"
      action={
        view?.hasMore
          ? {
              label: '전체 보기',
              testID: 'sessions-all',
              onPress: () => router.push('/past-self/sessions'),
            }
          : undefined
      }
    >
      {body}
    </Section>
  );
}

// 대화 목록 줄들: "M월 D일까지의 나 · 언제" + 마지막 메시지 한 줄 (최근 대화·지난 대화 공용)
export function SessionRows({ sessions }: { sessions: ChatSessionDto[] }) {
  return sessions.map((s, i) => (
    <Pressable
      key={s.id}
      testID={`session-${s.id}`}
      accessibilityRole="button"
      onPress={() => router.push(chatHref(s))}
      style={({ pressed }) => [
        styles.session,
        i < sessions.length - 1 && styles.sessionDivider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.sessionTop}>
        <Text style={styles.sessionTitle}>{pastSelfTitle(s.anchorDate)}</Text>
        <Text style={styles.sessionTime}>
          {relativeTime(s.lastMessageAt ?? s.createdAt)}
        </Text>
      </View>
      <Text style={styles.sessionPreview} numberOfLines={1}>
        {s.lastMessagePreview ?? '아직 메시지가 없어요'}
      </Text>
    </Pressable>
  ));
}

const DOT_STYLE: Record<DotState, object> = {
  known: { backgroundColor: colors.primary },
  draft: { backgroundColor: colors.disabled },
  unknown: { backgroundColor: colors.primary, opacity: 0.2 },
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  muted: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  error: { fontSize: 14, color: colors.danger },
  failed: { gap: spacing.xs },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.sm },
  tabOff: { opacity: 0.35 },
  tabText: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  tabTextOn: { fontWeight: '700', color: colors.text },
  tabLine: {
    alignSelf: 'stretch',
    height: 2,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  tabLineOn: { backgroundColor: colors.text },

  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barText: { flex: 1, gap: 2 },
  barTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  barLine: { fontSize: 13, color: colors.textMuted },
  barLineOff: { color: colors.danger },
  talk: {
    minWidth: 96,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  talkOff: { backgroundColor: colors.disabled },
  talkText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },

  rows: { gap: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  month: {
    width: 64,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  monthOn: { color: colors.text },
  track: { flex: 1, height: 22, justifyContent: 'center' },
  rail: { height: 2, borderRadius: 1, backgroundColor: colors.surfaceMuted },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
  dot: {
    position: 'absolute',
    top: (22 - DOT) / 2,
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    borderRadius: DOT / 2,
  },
  dotOn: {
    borderWidth: 2,
    borderColor: colors.surface,
    transform: [{ scale: 1.4 }],
  },
  here: {
    width: 44,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.md * 2,
    borderTopRightRadius: radius.md * 2,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  arrow: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.text,
    paddingHorizontal: 8,
  },
  arrowOff: { color: colors.disabled },

  session: { gap: 2, paddingVertical: spacing.sm + 2 },
  sessionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  sessionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  sessionTime: { fontSize: 12, color: colors.textMuted },
  sessionPreview: { fontSize: 14, color: colors.textMuted },
});
