import { router } from 'expo-router';
import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEntriesFeed, type EntryFeedItemDto } from '@/api/feed';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { SafeImage } from '@/components/SafeImage';
import { StateView } from '@/components/StateView';
import { indexBadgeOf } from '@/features/today/stage';
import { formatKoreanDate } from '@/lib/dates';
import { feedRows, type FeedRow } from '@/lib/feed';
import { colors, fonts, spacing, warm } from '@/theme';

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

// 목록 보기: 전체 일기를 최신순으로, 내리면 다음 페이지 (캘린더 탭)
export function ListView({ header }: Props) {
  const feed = useEntriesFeed();
  const rows = feedRows(feed.items);

  const renderRow = ({ item: row }: { item: FeedRow<EntryFeedItemDto> }) =>
    row.type === 'month' ? (
      <Text style={styles.month}>{row.label}</Text>
    ) : (
      <FeedItem item={row.item} />
    );

  let footer: ReactElement | undefined;
  if (feed.isFetchingNextPage) {
    footer = <ActivityIndicator style={styles.footer} color={warm.tan} />;
  } else if (feed.isFetchNextPageError) {
    footer = (
      <View style={styles.footer}>
        <Text style={styles.footerError}>{errorMessage(feed.error)}</Text>
        <Button
          title="다시 불러오기"
          variant="ghost"
          onPress={() => void feed.fetchNextPage()}
        />
      </View>
    );
  } else if (feed.isSuccess && !feed.hasNextPage && feed.items.length > 0) {
    footer = (
      <Text style={[styles.footer, styles.end]}>처음 기록까지 다 봤어요</Text>
    );
  }

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
  } else {
    empty = (
      <StateView
        status="empty"
        message="아직 기록이 없어요."
        actionLabel="오늘 일기 쓰기"
        onAction={() => router.push('/today')}
      />
    );
  }

  return (
    <FlatList
      testID="entries-feed"
      data={feed.isError && feed.items.length === 0 ? [] : rows}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      ListHeaderComponent={header}
      ListHeaderComponentStyle={styles.header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      onEndReached={() => {
        if (
          feed.hasNextPage &&
          !feed.isFetchingNextPage &&
          !feed.isFetchNextPageError
        ) {
          void feed.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      onRefresh={() => void feed.refetch()}
      refreshing={feed.isRefetching && !feed.isFetchingNextPage}
      contentContainerStyle={styles.content}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: warm.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  month: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: warm.ink,
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: warm.sand,
  },
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
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerError: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  end: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    color: warm.tan,
    fontSize: 13,
  },
});
