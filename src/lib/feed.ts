// 목록 보기(전체 일기, 최신순)의 순수 로직. RN·API 의존 없이 node --test로 검사한다.

type FeedItemLike = { date: string };

export type FeedRow<T extends FeedItemLike> =
  | { type: 'month'; key: string; label: string }
  | { type: 'entry'; key: string; item: T };

// "2026-10-24" → "2026년 10월"
export function monthLabel(date: string): string {
  return `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`;
}

// 달이 바뀌는 곳마다 구분 헤더를 넣는다 (입력은 이미 최신순)
export function feedRows<T extends FeedItemLike>(items: T[]): FeedRow<T>[] {
  const rows: FeedRow<T>[] = [];
  let current = '';
  for (const item of items) {
    const ym = item.date.slice(0, 7);
    if (ym !== current) {
      current = ym;
      rows.push({
        type: 'month',
        key: `month-${ym}`,
        label: monthLabel(item.date),
      });
    }
    rows.push({ type: 'entry', key: `entry-${item.date}`, item });
  }
  return rows;
}

// 다음 페이지 기준 날짜. 서버가 null을 주면 끝
export function nextBeforeOf(page: {
  nextBefore: string | null;
}): string | undefined {
  return page.nextBefore ?? undefined;
}

// 페이지를 합치면서 혹시 겹친 날짜는 한 번만 (같은 날 재요청 등)
export function mergePages<T extends FeedItemLike>(
  pages: { items: T[] }[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.date)) continue;
      seen.add(item.date);
      out.push(item);
    }
  }
  return out;
}
