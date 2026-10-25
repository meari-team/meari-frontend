import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEntriesRange, useEntry } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useRecentEntries } from '@/api/feed';
import { usePresets } from '@/api/past-self';
import { useDaySchedules } from '@/api/schedules';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SafeImage } from '@/components/SafeImage';
import { Section } from '@/components/Section';
import { FeedItem } from '@/features/calendar/ListView';
import {
  PRESET_LABELS,
  availabilityHint,
  shortKoreanDate,
} from '@/features/past-self/logic';
import { indexBadgeOf } from '@/features/today/stage';
import { formatKoreanDate } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';
import {
  TODAY_ACTION_LABEL,
  entryPreviewText,
  homePresets,
  memoryDates,
  pastSelfProgress,
  recordStats,
  shiftDate,
  todayActionOf,
} from './logic';

const SCHEDULE_PREVIEW = 3;
const RECENT_LIMIT = 3;
const PAST_SELF_REQUIRED = 7;

const confirmHref = (anchorDate: string) =>
  ({ pathname: '/past-self/confirm', params: { anchorDate } }) as const;

// 섹션 안의 로딩·에러. 섹션마다 따로 실패하고 따로 다시 시도한다
function Loading() {
  return <ActivityIndicator color={colors.primary} />;
}

function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View style={styles.failed}>
      <Text style={styles.error}>{errorMessage(error)}</Text>
      <Button title="다시 시도" variant="ghost" onPress={onRetry} />
    </View>
  );
}

// 오늘의 일기 카드: 없음 → 쓰기, 작성 중 → 이어 쓰기, 확정 → 보기
export function TodayCard({ today }: { today: string }) {
  const entry = useEntry(today);

  if (entry.isPending) {
    return (
      <Section title="오늘의 일기">
        <Loading />
      </Section>
    );
  }
  if (entry.isError) {
    return (
      <Section title="오늘의 일기">
        <Failed error={entry.error} onRetry={() => void entry.refetch()} />
      </Section>
    );
  }

  const e = entry.data;
  const action = todayActionOf(e?.status);
  const cover = e
    ? (e.photos.find((p) => p.id === e.coverPhotoId) ?? e.photos[0])
    : undefined;
  const preview = e ? entryPreviewText(e) : null;
  const badge =
    e?.status === 'CONFIRMED' ? indexBadgeOf(e.aiIndexStatus) : null;
  const open = () =>
    action === 'view'
      ? router.push(`/entry/${today}`)
      : router.navigate('/today');

  return (
    <Section title="오늘의 일기">
      {e ? (
        <View style={styles.todayRow}>
          {cover ? (
            <SafeImage uri={cover.url} style={styles.todayThumb} />
          ) : null}
          <View style={styles.flex}>
            {action === 'continue' ? (
              <Badge label="작성 중" tone="warning" icon="create-outline" />
            ) : badge ? (
              <Badge
                label={badge.label}
                tone={badge.tone}
                spinning={badge.spinning}
              />
            ) : null}
            <Text style={styles.body} numberOfLines={3}>
              {preview ?? '사진을 올려 두었어요.'}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>
          오늘 찍은 사진 몇 장이면 일기가 완성돼요.
        </Text>
      )}
      <Button
        title={TODAY_ACTION_LABEL[action]}
        variant={action === 'view' ? 'ghost' : 'primary'}
        onPress={open}
        testID="home-today-action"
      />
    </Section>
  );
}

// 오늘 일정 (최대 3개)
export function TodaySchedules({ today }: { today: string }) {
  const list = useDaySchedules(today);
  const toCalendar = () => router.navigate('/calendar');
  const action = { label: '캘린더에서 보기', onPress: toCalendar };

  if (list.isPending) {
    return (
      <Section title="오늘 일정" action={action}>
        <Loading />
      </Section>
    );
  }
  if (list.isError) {
    return (
      <Section title="오늘 일정" action={action}>
        <Failed error={list.error} onRetry={() => void list.refetch()} />
      </Section>
    );
  }

  const items = list.data;
  if (items.length === 0) {
    return (
      <Section title="오늘 일정">
        <Pressable accessibilityRole="button" onPress={toCalendar}>
          <Text style={styles.muted}>
            오늘 일정이 없어요 · <Text style={styles.link}>추가하기</Text>
          </Text>
        </Pressable>
      </Section>
    );
  }
  const rest = items.length - SCHEDULE_PREVIEW;
  return (
    <Section title="오늘 일정" action={action}>
      {items.slice(0, SCHEDULE_PREVIEW).map((s) => (
        <View key={s.id} style={styles.scheduleRow}>
          {/* 시간 없는 일정은 체크리스트 같은 할 일이라 시간 칸을 비운다 */}
          {s.time ? <Text style={styles.time}>{s.time}</Text> : null}
          <Text style={[styles.body, styles.flex]} numberOfLines={1}>
            {s.title}
          </Text>
        </View>
      ))}
      {rest > 0 ? <Text style={styles.muted}>외 {rest}개</Text> : null}
    </Section>
  );
}

function MemoryItem({ label, date }: { label: string; date: string }) {
  const entry = useEntry(date);
  const e = entry.data;
  // 기록이 없거나(404) 확정 전이거나 못 불러오면 조용히 숨긴다
  if (!e || e.status !== 'CONFIRMED') return null;
  const cover = e.photos.find((p) => p.id === e.coverPhotoId) ?? e.photos[0];
  return (
    <View style={styles.memory} testID={`home-memory-${date}`}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/entry/${date}`)}
        style={({ pressed }) => [styles.todayRow, pressed && styles.pressed]}
      >
        <SafeImage uri={cover?.url} style={styles.todayThumb} />
        <View style={styles.flex}>
          <Text style={styles.memoryLabel}>
            {label} · {formatKoreanDate(date)}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {entryPreviewText(e) ?? '내용 없음'}
          </Text>
        </View>
      </Pressable>
      <Button
        title="이때의 나와 대화하기"
        variant="ghost"
        onPress={() => router.push(confirmHref(date))}
      />
    </View>
  );
}

// 그날의 기억: 한 달 전·1년 전 오늘. 둘 다 없으면 섹션째 숨긴다
export function OnThisDay({ today }: { today: string }) {
  const [a, b] = memoryDates(today);
  const first = useEntry(a.date);
  const second = useEntry(b.date);
  const shown = [first.data, second.data].some(
    (e) => e?.status === 'CONFIRMED',
  );
  if (!shown) return null;
  return (
    <Section title="그날의 기억">
      <MemoryItem label={a.label} date={a.date} />
      <MemoryItem label={b.label} date={b.date} />
    </Section>
  );
}

// 과거의 나 바로가기: 1주·1개월·3개월 전 큰 버튼 3개 (기록이 모자란 시점은 흐리게 n/7)
export function PastSelfShortcuts() {
  const presets = usePresets();
  const action = {
    label: '다른 날 고르기',
    onPress: () => router.navigate('/past-self'),
  };

  if (presets.isPending) {
    return (
      <Section title="과거의 나와 대화하기" action={action}>
        <Loading />
      </Section>
    );
  }
  if (presets.isError) {
    return (
      <Section title="과거의 나와 대화하기" action={action}>
        <Failed error={presets.error} onRetry={() => void presets.refetch()} />
      </Section>
    );
  }

  const progress = pastSelfProgress(presets.data);
  if (!progress.available) {
    return (
      <Section title="과거의 나와 대화하기">
        <Text style={styles.muted}>
          {availabilityHint(progress.recordCount, PAST_SELF_REQUIRED)?.replace(
            '대화할',
            '과거의 나와 대화할',
          )}
        </Text>
      </Section>
    );
  }
  return (
    <Section title="과거의 나와 대화하기" action={action}>
      <View style={styles.presets}>
        {homePresets(presets.data).map((p) => (
          <Pressable
            key={p.preset}
            testID={`home-preset-${p.preset}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !p.available }}
            disabled={!p.available}
            onPress={() => router.push(confirmHref(p.anchorDate))}
            style={({ pressed }) => [
              styles.preset,
              !p.available && styles.presetOff,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.flex}>
              <Text
                style={[styles.presetTitle, !p.available && styles.offText]}
              >
                {PRESET_LABELS[p.preset]}의 나
              </Text>
              <Text style={styles.presetSub}>
                {p.available
                  ? `${shortKoreanDate(p.anchorDate)}까지 · 기록 ${p.recordCount}편`
                  : `기록이 모자라요 (${p.recordCount}/${PAST_SELF_REQUIRED})`}
              </Text>
            </View>
            {p.available ? (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            ) : null}
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

// 최근 기록 3개 (화면 스크롤 안이라 FlatList 대신 map). 더 보려면 "전체 보기" → 캘린더 전체 목록
export function RecentEntries() {
  const recent = useRecentEntries(RECENT_LIMIT);
  const action = {
    label: '전체 보기',
    testID: 'home-recent-all',
    onPress: () =>
      router.navigate({
        pathname: '/calendar',
        params: { mode: 'list', at: String(Date.now()) },
      }),
  };

  if (recent.isPending) {
    return (
      <Section title="최근 기록" action={action}>
        <Loading />
      </Section>
    );
  }
  if (recent.isError) {
    return (
      <Section title="최근 기록" action={action}>
        <Failed error={recent.error} onRetry={() => void recent.refetch()} />
      </Section>
    );
  }
  if (recent.data.length === 0) {
    return (
      <Section title="최근 기록">
        <Text style={styles.muted}>아직 남긴 기록이 없어요.</Text>
      </Section>
    );
  }
  return (
    <Section title="최근 기록" action={action}>
      <View style={styles.recent}>
        {recent.data.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </View>
    </Section>
  );
}

// 이번 달 기록한 날 · 연속 기록 (최근 62일만 본다)
export function RecordStats({ today }: { today: string }) {
  const monthStart = `${today.slice(0, 8)}01`;
  const recentStart = shiftDate(today, { days: -61 });
  const from = monthStart < recentStart ? monthStart : recentStart;
  const range = useEntriesRange(from, today);

  if (range.isPending) return null;
  if (range.isError) {
    return (
      <Section>
        <Failed error={range.error} onRetry={() => void range.refetch()} />
      </Section>
    );
  }

  const { monthCount, streak } = recordStats(range.data, today);
  return (
    <View style={styles.stats} testID="home-stats">
      <Stat
        icon="calendar-outline"
        value={`${monthCount}일`}
        label={`${Number(today.slice(5, 7))}월에 기록한 날`}
      />
      <Stat icon="flame-outline" value={`${streak}일`} label="연속 기록" />
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: 'calendar-outline' | 'flame-outline';
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.7 },
  failed: { gap: spacing.xs },
  error: { fontSize: 14, color: colors.danger },
  muted: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  todayRow: { flexDirection: 'row', gap: spacing.sm + 4 },
  todayThumb: { width: 72, height: 72, borderRadius: radius.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  time: {
    width: 48,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  memory: { gap: spacing.xs },
  memoryLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  presets: { gap: spacing.sm },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  presetOff: { backgroundColor: colors.surfaceMuted },
  presetTitle: { fontSize: 17, fontWeight: '700', color: colors.primary },
  offText: { color: colors.textMuted },
  presetSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  recent: { gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted },
});
