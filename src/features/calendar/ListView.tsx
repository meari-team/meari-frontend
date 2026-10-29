import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMonthFeed, type EntryFeedItemDto } from '@/api/feed';
import { errorMessage } from '@/api/errors';
import { SafeImage } from '@/components/SafeImage';
import { StateView } from '@/components/StateView';
import { indexBadgeOf } from '@/features/today/stage';
import { formatKoreanDate, todayKst } from '@/lib/dates';
import {
  monthKeyOf,
  monthTitle,
  shiftMonthKey,
  type MonthKey,
} from '@/lib/feed';
import { fonts, spacing, warm } from '@/theme';

type Props = {
  // 상단 월간/연간/목록 전환. 목록에서는 FlatList가 화면 스크롤을 맡으므로 헤더로 넣는다
  header: ReactElement;
};

// 확정한 일기는 상세, 작성 중이면 이어 쓰기로
const open = (item: EntryFeedItemDto) =>
  router.push(
    item.status === 'CONFIRMED'
      ? `/entry/${item.date}`
      : `/today?date=${item.date}`,
  );

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 일기장 한 줄: 왼쪽 날짜(큰 숫자 + 요일) · 가운데 본문 · 오른쪽 대표 사진. 카드 대신 얇은 줄로 나눈다
export function FeedItem({ item }: { item: EntryFeedItemDto }) {
  const confirmed = item.status === 'CONFIRMED';
  const badge = confirmed ? indexBadgeOf(item.aiIndexStatus) : null;
  const weekday = WEEKDAYS[new Date(`${item.date}T00:00:00Z`).getUTCDay()];
  return (
    <Pressable
      testID={`feed-${item.date}`}
      accessibilityRole="button"
      accessibilityLabel={`${formatKoreanDate(item.date)} 일기${confirmed ? '' : ', 작성 중'}`}
      onPress={() => open(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.day}>
        <Text style={styles.dayNumber}>{Number(item.date.slice(8))}</Text>
        <Text style={styles.weekday}>{weekday}</Text>
      </View>
      <View style={styles.body}>
        {/* 상태는 꾸밈 없이 글자로만 (작성 중 / 기억 정리 상태) */}
        {!confirmed ? (
          <Text style={[styles.state, styles.writing]}>작성 중</Text>
        ) : badge && badge.tone !== 'success' ? (
          <Text style={styles.state}>{badge.label}</Text>
        ) : null}
        <Text
          style={[styles.excerpt, !item.excerpt && styles.excerptEmpty]}
          numberOfLines={3}
        >
          {item.excerpt ??
            (confirmed ? '내용 없음' : '아직 일기를 완성하지 않았어요')}
        </Text>
      </View>
      {item.coverPhotoUrl ? (
        <SafeImage uri={item.coverPhotoUrl} style={styles.thumb} />
      ) : null}
    </Pressable>
  );
}

// 목록 보기: 한 달씩 끊어서 최신순으로. 위 ‹ 2026년 10월 › 로 달을 넘긴다 (캘린더 탭)
export function ListView({ header }: Props) {
  const latest = monthKeyOf(todayKst());
  const [month, setMonth] = useState<MonthKey>(latest);
  const feed = useMonthFeed(month);
  const atLatest = month.year === latest.year && month.month === latest.month;
  const go = (delta: number) =>
    setMonth((m) => shiftMonthKey(m, delta, latest));

  const bar = (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전 달"
        hitSlop={10}
        onPress={() => go(-1)}
        testID="list-prev-month"
      >
        <Ionicons name="chevron-back" size={22} color={warm.ink} />
      </Pressable>
      <View style={styles.barTitle}>
        <Text style={styles.barMonth} testID="list-month">
          {monthTitle(month)}
        </Text>
        <Text style={styles.barCount}>
          {feed.data ? `${feed.data.length}편` : ''}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다음 달"
        accessibilityState={{ disabled: atLatest }}
        disabled={atLatest}
        hitSlop={10}
        onPress={() => go(1)}
        testID="list-next-month"
      >
        <Ionicons
          name="chevron-forward"
          size={22}
          color={atLatest ? warm.sand : warm.ink}
        />
      </Pressable>
    </View>
  );

  let empty: ReactElement;
  if (feed.isPending) {
    empty = <StateView status="loading" />;
  } else if (feed.isError) {
    empty = (
      <StateView
        status="error"
        message={errorMessage(feed.error)}
        onRetry={() => void feed.refetch()}
      />
    );
  } else if (atLatest) {
    empty = (
      <StateView
        status="empty"
        message="이번 달에는 아직 기록이 없어요."
        actionLabel="오늘 일기 쓰기"
        onAction={() => router.push('/today')}
      />
    );
  } else {
    empty = (
      <StateView
        status="empty"
        message={`${month.month}월에는 기록이 없어요.`}
      />
    );
  }

  return (
    <FlatList
      testID="entries-feed"
      data={feed.data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedItem item={item} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {bar}
        </View>
      }
      ListEmptyComponent={empty}
      onRefresh={() => void feed.refetch()}
      refreshing={feed.isRefetching}
      contentContainerStyle={[
        styles.content,
        feed.isPlaceholderData && styles.loadingNext,
      ]}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: warm.background },
  // 다음 달을 읽는 중: 앞 달 목록을 흐리게 둔다
  loadingNext: { opacity: 0.5 },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md },
  // 달 넘기기 줄: ‹ 2026년 10월 · 17편 ›
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: warm.sand,
  },
  // 달과 편수를 한 줄에, 사이를 띄워서
  barTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  barMonth: { fontFamily: fonts.bold, fontSize: 17, color: warm.ink },
  barCount: { fontFamily: fonts.semibold, fontSize: 14, color: warm.tan },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: warm.sand,
  },
  pressed: { opacity: 0.6 },
  day: { width: 34, alignItems: 'center' },
  dayNumber: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: warm.ink,
  },
  weekday: { fontFamily: fonts.medium, fontSize: 12, color: warm.tan },
  body: { flex: 1, gap: 4, paddingTop: 3 },
  state: { fontFamily: fonts.medium, fontSize: 12, color: warm.tan },
  writing: { color: warm.clay },
  excerpt: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: warm.black,
  },
  excerptEmpty: { color: warm.tan },
  thumb: { width: 64, height: 64, borderRadius: 7 },
});
