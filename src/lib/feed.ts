// 전체 일기 목록(달 단위)의 순수 로직. RN·API 의존 없이 node --test로 검사한다.

export type MonthKey = { year: number; month: number }; // month: 1~12

const pad = (n: number) => String(n).padStart(2, '0');

// "2026년 10월"
export function monthTitle({ year, month }: MonthKey): string {
  return `${year}년 ${month}월`;
}

// 그 달 일기를 한 번에 읽는 피드 요청: 다음 달 1일 미만 + 최대 31편 (서버 최대 50)
export function monthFeedQuery({ year, month }: MonthKey): {
  before: string;
  limit: number;
} {
  const next =
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return { before: `${next.year}-${pad(next.month)}-01`, limit: 31 };
}

// 응답에서 그 달 것만 (앞 달 일기가 섞여 올 수 있다)
export function inMonth<T extends { date: string }>(
  items: T[],
  { year, month }: MonthKey,
): T[] {
  const prefix = `${year}-${pad(month)}-`;
  return items.filter((i) => i.date.startsWith(prefix));
}

// 달 넘기기: delta만큼 옮기고, 이번 달보다 뒤로는 못 간다
export function shiftMonthKey(
  { year, month }: MonthKey,
  delta: number,
  latest: MonthKey,
): MonthKey {
  const index = year * 12 + (month - 1) + delta;
  const max = latest.year * 12 + (latest.month - 1);
  const i = Math.min(index, max);
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

export const monthKeyOf = (date: string): MonthKey => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});
