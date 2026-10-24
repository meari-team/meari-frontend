import Ionicons from '@expo/vector-icons/Ionicons';
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
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SafeImage } from '@/components/SafeImage';
import { StateView } from '@/components/StateView';
import { indexBadgeOf } from '@/features/today/stage';
import { formatKoreanDate } from '@/lib/dates';
import { feedRows, type FeedRow } from '@/lib/feed';
import { colors, radius, spacing } from '@/theme';

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

function FeedItem({ item }: { item: EntryFeedItemDto }) {
  const confirmed = item.status === 'CONFIRMED';
  const badge = confirmed ? indexBadgeOf(item.aiIndexStatus) : null;
  return (
    <Pressable
      testID={`feed-${item.date}`}
      accessibilityRole="button"
      accessibilityLabel={`${formatKoreanDate(item.date)} 일기${confirmed ? '' : ', 작성 중'}`}
      onPress={() => open(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <SafeImage uri={item.coverPhotoUrl} style={styles.thumb} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.date}>{formatKoreanDate(item.date)}</Text>
          {!confirmed ? (
            <Badge label="작성 중" tone="warning" icon="create-outline" />
          ) : badge && badge.tone !== 'success' ? (
            <Badge
              label={badge.label}
              tone={badge.tone}
              spinning={badge.spinning}
            />
          ) : null}
        </View>
        <Text
          style={[styles.excerpt, !item.excerpt && styles.excerptEmpty]}
          numberOfLines={3}
        >
          {item.excerpt ??
            (confirmed ? '내용 없음' : '아직 일기를 완성하지 않았어요')}
        </Text>
        <View style={styles.meta}>
          <View style={styles.dots}>
            {item.categoryColors.map((c) => (
              <View key={c} style={[styles.dot, { backgroundColor: c }]} />
            ))}
          </View>
          {item.photoCount > 0 ? (
            <View style={styles.photoCount}>
              <Ionicons
                name="image-outline"
                size={13}
                color={colors.textMuted}
              />
              <Text style={styles.metaText}>{item.photoCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
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
    footer = <ActivityIndicator style={styles.footer} color={colors.primary} />;
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
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  month: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  thumb: { width: 72, height: 72, borderRadius: radius.sm },
  body: { flex: 1, gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  date: { fontSize: 15, fontWeight: '700', color: colors.text },
  excerpt: { fontSize: 14, lineHeight: 20, color: colors.text },
  excerptEmpty: { color: colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: 4, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  photoCount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: colors.textMuted },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerError: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  end: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
