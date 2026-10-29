import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { inMonth, monthFeedQuery, type MonthKey } from '@/lib/feed';
import { api } from './client';
import { entriesKey } from './entries';
import { unwrap } from './errors';
import type { components } from './schema';

export type EntryFeedItemDto = components['schemas']['EntryFeedItemDto'];

// 전체 일기 목록(달 단위). entriesKey 아래 두어 일기가 바뀌면 함께 갱신된다
export const entriesFeedKey = [...entriesKey, 'feed'] as const;

// 한 달 치 일기 (최신순). 한 달은 31편을 넘지 않아 한 번에 읽는다
export function useMonthFeed(month: MonthKey) {
  return useQuery({
    queryKey: [...entriesFeedKey, month.year, month.month],
    // 다음 달을 읽는 동안 지금 목록을 그대로 둬서 화면이 위로 당겨지지 않게
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const page = await unwrap(
        api.GET('/api/v1/entries/feed', {
          params: { query: monthFeedQuery(month) },
        }),
      );
      return inMonth(page.items, month);
    },
  });
}

// 홈의 최근 기록 (첫 페이지만). entriesKey 아래라 일기가 바뀌면 함께 갱신된다
export function useRecentEntries(limit: number) {
  return useQuery({
    queryKey: [...entriesKey, 'recent', limit],
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/v1/entries/feed', { params: { query: { limit } } }),
        )
      ).items,
  });
}
