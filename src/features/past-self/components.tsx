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
import { SafeImage } from '@/components/SafeImage';
import { Section } from '@/components/Section';
import { MonthView } from '@/features/calendar/MonthView';
import { entryPreviewText } from '@/features/home/logic';
import { shiftMonth, yearMonthOf, type YearMonth } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';
import {
  PRESET_LABELS,
  dayPosition,
  dotState,
  lastConfirmedOnOrBefore,
  pastSelfTitle,
  relativeTime,
  shortKoreanDate,
  timelineMonths,
  type DotState,
} from './logic';

const chatHref = (s: ChatSessionDto) =>
  ({
    pathname: '/past-self/[sessionId]',
    params: { sessionId: s.id, anchorDate: s.anchorDate },
  }) as const;

// 1주·1개월·3개월·6개월·1년 전. 기록이 모자란 시점은 흐리게 + n/7
export function PresetChips({
  presets,
  anchor,
  required,
  onPick,
}: {
  presets: AvailabilityPresetDto[];
  anchor: string;
  required: number;
  onPick: (date: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {presets.map((p) => {
        const on = p.available && p.anchorDate === anchor;
        return (
          <Pressable
            key={p.preset}
            testID={`preset-${p.preset}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !p.available, selected: on }}
            disabled={!p.available}
            onPress={() => onPick(p.anchorDate)}
            style={({ pressed }) => [
              styles.chip,
              on && styles.chipOn,
              !p.available && styles.chipOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>
              {PRESET_LABELS[p.preset]}
            </Text>
            {!p.available ? (
              <Text style={styles.chipCount}>
                {p.recordCount}/{required}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// 고른 기준일의 나: 기억이 되는 기록 수 · 첫 기록 · 그때의 마지막 일기 → 바로 대화 시작
export function SelfCard({
  anchor,
  entries,
}: {
  anchor: string;
  entries: EntrySummaryDto[];
}) {
  const availability = useAvailability(anchor);
  const create = useCreateSession();
  const last = lastConfirmedOnOrBefore(entries, anchor);

  const start = () =>
    create.mutate(anchor, {
      onSuccess: (s) => router.push(chatHref(s)),
    });

  let summary;
  if (availability.isPending) {
    summary = <ActivityIndicator color={colors.primary} />;
  } else if (availability.isError) {
    summary = (
      <Text style={styles.error}>{errorMessage(availability.error)}</Text>
    );
  } else {
    const a = availability.data;
    summary = (
      <Text style={styles.count} testID="self-count">
        {a.firstRecordDate
          ? `기록 ${a.recordCount}편 · ${shortKoreanDate(a.firstRecordDate)}부터`
          : '이 날까지 확정한 일기가 없어요'}
      </Text>
    );
  }

  const a = availability.data;
  const lacking =
    a && !a.available
      ? `그날까지 확정한 일기가 ${a.requiredCount}편 이상이어야 대화할 수 있어요 (${a.recordCount}/${a.requiredCount})`
      : null;

  return (
    <View style={styles.selfCard} testID="self-card">
      <Text style={styles.selfTitle}>{pastSelfTitle(anchor)}</Text>
      {summary}

      {last ? <LastEntry entry={last} /> : null}

      <Text style={styles.notice}>
        {shortKoreanDate(anchor)} 이후의 일은 몰라요. AI가 그때까지의 기록으로
        재구성한 모습이라 실제와 다를 수 있어요.
      </Text>

      {lacking ? <Text style={styles.lacking}>{lacking}</Text> : null}
      {create.isError ? (
        <Text style={styles.error}>{errorMessage(create.error)}</Text>
      ) : null}
      <Button
        title="이때의 나와 대화하기"
        testID="start-chat"
        disabled={!a?.available}
        loading={create.isPending}
        onPress={start}
      />
    </View>
  );
}

// 그때의 마지막 일기 한 줄 (누르면 원문)
function LastEntry({ entry }: { entry: EntrySummaryDto }) {
  const detail = useEntry(entry.date);
  const text =
    entry.summary ??
    (detail.data ? entryPreviewText(detail.data) : null) ??
    (detail.isPending ? '' : '내용 없음');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${shortKoreanDate(entry.date)} 일기 보기`}
      onPress={() => router.push(`/entry/${entry.date}`)}
      style={({ pressed }) => [styles.last, pressed && styles.pressed]}
    >
      {entry.coverPhotoUrl ? (
        <SafeImage uri={entry.coverPhotoUrl} style={styles.thumb} />
      ) : null}
      <View style={styles.lastBody}>
        <Text style={styles.lastLabel}>
          그때의 마지막 일기 · {shortKoreanDate(entry.date)}
        </Text>
        <Text style={styles.lastText} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
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
  let body;
  if (pending) {
    body = <ActivityIndicator color={colors.primary} />;
  } else if (error || !sessions) {
    body = (
      <View style={styles.failed}>
        <Text style={styles.error}>{errorMessage(error)}</Text>
        <Button title="다시 시도" variant="ghost" onPress={onRetry} />
      </View>
    );
  } else if (sessions.length === 0) {
    body = <Text style={styles.muted}>아직 나눈 대화가 없어요.</Text>;
  } else {
    body = sessions.map((s, i) => (
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
  return <Section title="최근 대화">{body}</Section>;
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

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipOff: { opacity: 0.45 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextOn: { color: colors.surface },
  chipCount: { fontSize: 12, color: colors.textMuted },

  selfCard: {
    gap: spacing.sm + 2,
    padding: spacing.lg,
    borderRadius: radius.md + 4,
    backgroundColor: colors.primarySoft,
  },
  selfTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  count: { fontSize: 15, color: colors.textMuted },
  last: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  lastBody: { flex: 1, gap: 2 },
  lastLabel: { fontSize: 12, color: colors.textMuted },
  lastText: { fontSize: 15, lineHeight: 21, color: colors.text },
  notice: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  lacking: { fontSize: 13, lineHeight: 19, color: colors.danger },

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
