import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEntry } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useRecentEntries, type EntryFeedItemDto } from '@/api/feed';
import { usePresets } from '@/api/past-self';
import { useDaySchedules, useToggleSchedule } from '@/api/schedules';
import { SafeImage } from '@/components/SafeImage';
import { PRESET_LABELS } from '@/features/past-self/logic';
import { fonts, warm } from '@/theme';
import {
  TODAY_ACTION_LABEL,
  homePresets,
  pastSelfProgress,
  shortDate,
  todayActionOf,
} from './logic';

const PHOTO_SLOTS = 3;
const SCHEDULE_PREVIEW = 3;
const RECENT_LIMIT = 3;
const PAST_SELF_REQUIRED = 7;

const checkIcon = require('../../../assets/images/home/check.png');

const confirmHref = (anchorDate: string) =>
  ({ pathname: '/past-self/confirm', params: { anchorDate } }) as const;

type CardLink = { label: string; onPress: () => void; testID?: string };

// 홈 카드 공통 틀: 흰 카드 + 제목 + 아래 가운데 링크
function Card({
  title,
  link,
  children,
}: {
  title: string;
  link?: CardLink;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
      {link ? (
        <Pressable
          accessibilityRole="button"
          onPress={link.onPress}
          testID={link.testID}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Text style={styles.linkText}>{link.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// 카드 안의 로딩·에러. 카드마다 따로 실패하고 따로 다시 시도한다
function Loading() {
  return <ActivityIndicator color={warm.tan} style={styles.loading} />;
}

function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onRetry}>
      <Text style={styles.muted}>
        {errorMessage(error)} · <Text style={styles.underline}>다시 시도</Text>
      </Text>
    </Pressable>
  );
}

// 오늘의 일기: 사진 3칸. 없음 → 쓰기, 작성 중 → 이어 쓰기, 확정 → 전체 보기
export function TodayCard({ today }: { today: string }) {
  const entry = useEntry(today);
  const e = entry.data;
  const action = todayActionOf(e?.status);
  const open = () =>
    action === 'view'
      ? router.push(`/entry/${today}`)
      : router.navigate('/today');
  const link = {
    label: TODAY_ACTION_LABEL[action],
    onPress: open,
    testID: 'home-today-action',
  };

  if (entry.isPending) {
    return (
      <Card title="오늘의 일기">
        <Loading />
      </Card>
    );
  }
  if (entry.isError) {
    return (
      <Card title="오늘의 일기">
        <Failed error={entry.error} onRetry={() => void entry.refetch()} />
      </Card>
    );
  }

  // 아직 안 쓴 날 (시안 "홈 화면(new)"): 안내 한 줄 + 황갈색 알약 버튼
  if (!e) {
    return (
      <Card title="오늘의 일기">
        <Text style={styles.muted}>
          오늘 찍은 사진 몇 장이면 일기가 완성돼요.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={open}
          testID="home-today-action"
          style={({ pressed }) => [
            styles.writeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.writeText}>{TODAY_ACTION_LABEL[action]}</Text>
        </Pressable>
      </Card>
    );
  }

  // 대표 사진을 맨 앞에. 사진이 모자란 칸은 빈 칸으로 둔다
  const photos = e
    ? [...e.photos].sort(
        (a, b) =>
          Number(b.id === e.coverPhotoId) - Number(a.id === e.coverPhotoId),
      )
    : [];
  return (
    <Card title="오늘의 일기" link={link}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={link.label}
        onPress={open}
        style={styles.photos}
      >
        {Array.from({ length: PHOTO_SLOTS }, (_, i) => {
          const photo = photos[i];
          return photo ? (
            <SafeImage key={photo.id} uri={photo.url} style={styles.photo} />
          ) : (
            <View key={`empty-${i}`} style={[styles.photo, styles.empty]} />
          );
        })}
      </Pressable>
    </Card>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
      {checked ? <Image source={checkIcon} style={styles.check} /> : null}
    </View>
  );
}

// 오늘의 일정: 왼쪽은 시간 있는 일정, 오른쪽은 시간 없는 할 일(체크해서 끝냄)
export function TodaySchedules({ today }: { today: string }) {
  const list = useDaySchedules(today);
  const toggle = useToggleSchedule();
  const link = {
    label: '캘린더에서 보기',
    onPress: () => router.navigate('/calendar'),
  };

  if (list.isPending) {
    return (
      <Card title="오늘의 일정" link={link}>
        <Loading />
      </Card>
    );
  }
  if (list.isError) {
    return (
      <Card title="오늘의 일정" link={link}>
        <Failed error={list.error} onRetry={() => void list.refetch()} />
      </Card>
    );
  }

  const timed = list.data.filter((s) => s.time).slice(0, SCHEDULE_PREVIEW);
  const todos = list.data.filter((s) => !s.time).slice(0, SCHEDULE_PREVIEW);
  if (timed.length + todos.length === 0) {
    return (
      <Card title="오늘의 일정">
        {/* 시안: 안내 옆 밑줄 링크 */}
        <Text style={styles.muted}>
          오늘 일정이 없어요.{'  '}
          <Text
            style={styles.inlineLink}
            accessibilityRole="link"
            onPress={link.onPress}
          >
            추가하기
          </Text>
        </Text>
      </Card>
    );
  }
  return (
    <Card title="오늘의 일정" link={link}>
      <View style={styles.columns}>
        {timed.length > 0 ? (
          <View style={styles.column}>
            {timed.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.time}>{s.time}</Text>
                <Text style={[styles.body, styles.flex]} numberOfLines={1}>
                  {s.title}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {todos.length > 0 ? (
          <View style={styles.column}>
            {todos.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: s.completed }}
                onPress={() =>
                  toggle.mutate({ id: s.id, completed: !s.completed })
                }
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <CheckBox checked={s.completed} />
                <Text style={[styles.body, styles.flex]} numberOfLines={1}>
                  {s.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// 과거의 나와 대화하기: 1주·1개월·3개월 전 알약 버튼 (기록이 모자란 시점은 흐리게, 누를 수 없음)
export function PastSelfShortcuts() {
  const presets = usePresets();

  if (presets.isPending) {
    return (
      <Card title="과거의 나와 대화하기">
        <Loading />
      </Card>
    );
  }
  if (presets.isError) {
    return (
      <Card title="과거의 나와 대화하기">
        <Failed error={presets.error} onRetry={() => void presets.refetch()} />
      </Card>
    );
  }

  const progress = pastSelfProgress(presets.data);
  if (!progress.available) {
    return (
      <Card title="과거의 나와 대화하기">
        {/* 시안: 안내 + 아래 (모은 수/7) */}
        <Text style={[styles.muted, styles.lockedHint]}>
          기록이 {PAST_SELF_REQUIRED}일 이상 쌓이면 과거의 나와 대화할 수
          있어요.
        </Text>
        <Text style={styles.lockedCount}>
          ({Math.min(progress.recordCount, PAST_SELF_REQUIRED)}/
          {PAST_SELF_REQUIRED})
        </Text>
      </Card>
    );
  }
  return (
    <Card title="과거의 나와 대화하기">
      <View style={styles.pills}>
        {homePresets(presets.data).map((p) => (
          <Pressable
            key={p.preset}
            testID={`home-preset-${p.preset}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !p.available }}
            disabled={!p.available}
            onPress={() => router.push(confirmHref(p.anchorDate))}
            style={({ pressed }) => [
              styles.pill,
              !p.available && styles.pillOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {PRESET_LABELS[p.preset]}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function RecentItem({ item }: { item: EntryFeedItemDto }) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={`home-recent-${item.date}`}
      onPress={() => router.push(`/entry/${item.date}`)}
      style={({ pressed }) => [styles.recent, pressed && styles.pressed]}
    >
      <SafeImage uri={item.coverPhotoUrl} style={styles.recentPhoto} />
      <View style={styles.flex}>
        <Text style={styles.recentDate}>{shortDate(item.date)}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {item.excerpt ?? '사진을 올려 두었어요.'}
        </Text>
      </View>
    </Pressable>
  );
}

// 최근 기록 3개. 더 보려면 "전체 보기" → 캘린더 전체 목록
export function RecentEntries() {
  const recent = useRecentEntries(RECENT_LIMIT);
  const link = {
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
      <Card title="최근 기록">
        <Loading />
      </Card>
    );
  }
  if (recent.isError) {
    return (
      <Card title="최근 기록">
        <Failed error={recent.error} onRetry={() => void recent.refetch()} />
      </Card>
    );
  }
  if (recent.data.length === 0) {
    return (
      <Card title="최근 기록">
        <Text style={styles.muted}>아직 남긴 기록이 없어요.</Text>
      </Card>
    );
  }
  return (
    <Card title="최근 기록" link={link}>
      <View style={styles.recentList}>
        {recent.data.map((item) => (
          <RecentItem key={item.id} item={item} />
        ))}
      </View>
    </Card>
  );
}

const body = {
  fontFamily: fonts.regular,
  fontSize: 13,
  lineHeight: 20,
  color: warm.black,
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  loading: { paddingVertical: 12 },
  card: {
    marginHorizontal: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: warm.black,
    marginBottom: 14,
  },
  link: { alignSelf: 'center', padding: 10 },
  linkText: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  // 안내 문구 (시안: 갈색 SemiBold 13)
  muted: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: warm.brown,
    // 시안: 제목 바로 아래 (제목 여백 14 중 6을 당긴다)
    marginTop: -6,
    paddingBottom: 14,
  },
  inlineLink: { color: warm.ink, textDecorationLine: 'underline' },
  lockedHint: { paddingBottom: 3 },
  lockedCount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.tan,
    paddingBottom: 14,
  },
  writeButton: {
    height: 42,
    marginTop: 7,
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.field },
  underline: { textDecorationLine: 'underline' },
  body,
  photos: { flexDirection: 'row', gap: 11, marginBottom: 6 },
  photo: { flex: 1, aspectRatio: 1, borderRadius: 7 },
  empty: { backgroundColor: 'rgba(215,201,184,0.35)' },
  columns: { flexDirection: 'row', gap: 15 },
  column: { flex: 1, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 20 },
  time: {
    width: 45,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.ink,
    marginRight: 3,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: warm.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: warm.ink },
  check: { width: 11, height: 11 },
  pills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  pill: {
    width: 79,
    height: 31,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warm.tan,
  },
  pillOff: { opacity: 0.4 },
  pillText: { fontFamily: fonts.semibold, fontSize: 13, color: warm.field },
  recentList: { gap: 11 },
  recent: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: warm.sand,
    borderRadius: 17,
  },
  recentPhoto: { width: 82, height: 82, borderRadius: 7 },
  recentDate: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.brown,
    marginTop: 2,
    marginBottom: 4,
  },
});
