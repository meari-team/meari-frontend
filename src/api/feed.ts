import { useInfiniteQuery } from '@tanstack/react-query';
import { mergePages, nextBeforeOf } from '@/lib/feed';
import { api } from './client';
import { entriesKey } from './entries';
import { unwrap } from './errors';
import type { components } from './schema';

export type EntryFeedItemDto = components['schemas']['EntryFeedItemDto'];

const PAGE_SIZE = 20;

// 전체 일기 목록(최신순, 커서 = 날짜). entriesKey 아래 두어 일기가 바뀌면 함께 갱신된다
export const entriesFeedKey = [...entriesKey, 'feed'] as const;

export function useEntriesFeed() {
  const query = useInfiniteQuery({
    queryKey: entriesFeedKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET('/api/v1/entries/feed', {
          params: { query: { before: pageParam, limit: PAGE_SIZE } },
        }),
      ),
    getNextPageParam: nextBeforeOf,
  });
  return {
    ...query,
    items: query.data ? mergePages(query.data.pages) : [],
  };
}
