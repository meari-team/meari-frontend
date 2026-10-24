// 캘린더 계산. 날짜는 모두 KST 기록일 문자열(YYYY-MM-DD)로 다룬다.
export type YearMonth = { year: number; month: number }; // month: 1~12

const pad = (n: number) => String(n).padStart(2, '0');

export const toDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

export function yearMonthOf(date: string): YearMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function shiftMonth(
  { year, month }: YearMonth,
  delta: number,
): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// 월간 목록 API(E1) 범위
export function monthRange(ym: YearMonth) {
  return {
    from: toDate(ym.year, ym.month, 1),
    to: toDate(ym.year, ym.month, daysInMonth(ym)),
  };
}

// 연간 목록 API(E1) 범위 (최대 366일 안)
export function yearRange(year: number) {
  return { from: toDate(year, 1, 1), to: toDate(year, 12, 31) };
}

// 일요일 시작 주 단위 격자. 앞뒤 빈칸은 null
export function monthGrid(ym: YearMonth): (string | null)[][] {
  const firstWeekday = new Date(Date.UTC(ym.year, ym.month - 1, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth(ym) }, (_, i) =>
      toDate(ym.year, ym.month, i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// 미래에는 일기가 없지만 일정은 미리 넣을 수 있다 → 오늘 기준 12개월 뒤까지 넘긴다
export const MONTHS_AHEAD = 12;

export function canGoNextMonth(
  ym: YearMonth,
  today: string,
  monthsAhead = MONTHS_AHEAD,
): boolean {
  const t = yearMonthOf(today);
  return ym.year * 12 + ym.month < t.year * 12 + t.month + monthsAhead;
}

export type DayState = 'empty' | 'writing' | 'confirmed' | 'future';

// 캘린더 칸 표시: 확정 = 채운 칸, 확정 전 = 점선("작성 중"), 미래 = 흐리게
export function dayStateOf(
  date: string,
  today: string,
  status: string | undefined,
): DayState {
  if (date > today) return 'future';
  if (!status) return 'empty';
  return status === 'CONFIRMED' ? 'confirmed' : 'writing';
}

// 같은 달끼리 묶기 (연간 보관함). 최신 달이 위
export function groupByMonth<T extends { date: string }>(
  items: T[],
): { month: number; items: T[] }[] {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const m = Number(item.date.slice(5, 7));
    groups.set(m, [...(groups.get(m) ?? []), item]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([month, list]) => ({
      month,
      items: [...list].sort((a, b) => a.date.localeCompare(b.date)),
    }));
}
