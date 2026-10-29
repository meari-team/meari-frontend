// 과거의 나 화면의 순수 로직 (prd.md §7-2)
// node --test로 바로 돌리기 위해 다른 앱 모듈을 import하지 않는다

export type Preset = '1W' | '1M' | '3M' | '6M' | '1Y';

export const PRESET_LABELS: Record<Preset, string> = {
  '1W': '1주 전',
  '1M': '1개월 전',
  '3M': '3개월 전',
  '6M': '6개월 전',
  '1Y': '1년 전',
};

// 한 줄 시점 탭용 짧은 이름 (5개가 한 줄에 들어가게 "전"을 뺀다)
export const PRESET_SHORT: Record<Preset, string> = {
  '1W': '1주',
  '1M': '1개월',
  '3M': '3개월',
  '6M': '6개월',
  '1Y': '1년',
};

// 그날의 나 카드 둘째 줄: "16편 - 마지막 일기 첫 줄" / 모자라면 "기록이 모자라요 (3/7)"
export function selfBarLine(
  a: { available: boolean; recordCount: number; requiredCount: number },
  lastText: string | null,
): string {
  if (!a.available) {
    return `기록이 모자라요 (${a.recordCount}/${a.requiredCount})`;
  }
  return lastText ? `${a.recordCount}편 - ${lastText}` : `${a.recordCount}편`;
}

// "10월 10일" (요일 없이, 대화 제목·배지용)
export function shortKoreanDate(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;
}

// "그날까지의 기록만 아는 나" — 그날 하루가 아니라 그날까지 이어진 나라는 걸 드러낸다
export const pastSelfTitle = (anchorDate: string) =>
  `${shortKoreanDate(anchorDate)}까지의 나`;

// 7일 미만이면 비활성 안내 문구 (없으면 null)
export function availabilityHint(
  recordCount: number,
  required: number,
): string | null {
  return recordCount >= required
    ? null
    : `기록이 ${required}일 이상 쌓이면 대화할 수 있어요 (${recordCount}/${required})`;
}

type Page<M> = { items: M[]; nextCursor: string | null };

// 페이지는 [최근, 그 이전, ...] 순서로 쌓인다 → 화면은 오래된 순으로
export function flattenPages<M>(pages: Page<M>[]): M[] {
  return [...pages].reverse().flatMap((p) => p.items);
}

// 보낸 메시지를 가장 최근 페이지 끝에 붙인다 (같은 id는 한 번만)
export function appendToLatest<M extends { id: string }>(
  pages: Page<M>[],
  messages: M[],
): Page<M>[] {
  if (pages.length === 0) return [{ items: messages, nextCursor: null }];
  const [latest, ...older] = pages;
  const seen = new Set(latest.items.map((m) => m.id));
  return [
    {
      ...latest,
      items: [...latest.items, ...messages.filter((m) => !seen.has(m.id))],
    },
    ...older,
  ];
}

// ── 타임라인 (과거의 나 첫 화면) ─────────────────────────────

type EntryLike = { date: string; status: string };

// 점 상태: 그때의 나가 아는 확정 일기 / 작성 중(기억 아님) / 기준일 이후(그때의 나는 모르는 기록)
export type DotState = 'known' | 'draft' | 'unknown';

export function dotState(entry: EntryLike, anchor: string): DotState {
  if (entry.date > anchor) return 'unknown';
  return entry.status === 'CONFIRMED' ? 'known' : 'draft';
}

export type TimelineMonth = {
  key: string; // "2026-10"
  label: string; // 올해면 "10월", 아니면 "25년 12월"
  days: number; // 그 달의 날 수
  dots: { date: string; day: number; status: string }[];
};

const daysOf = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

// 첫 기록이 있는 달부터 이번 달까지, 최근 달이 위로. 기록이 없으면 빈 배열
export function timelineMonths(
  entries: EntryLike[],
  today: string,
): TimelineMonth[] {
  if (entries.length === 0) return [];
  const first = entries.reduce((a, e) => (e.date < a ? e.date : a), today);
  const thisYear = Number(today.slice(0, 4));
  const months: TimelineMonth[] = [];
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  const endKey = first.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    months.push({
      key,
      label: y === thisYear ? `${m}월` : `${String(y).slice(2)}년 ${m}월`,
      days: daysOf(y, m),
      dots: entries
        .filter((e) => e.date.startsWith(key))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({ ...e, day: Number(e.date.slice(8)) })),
    });
    if (key <= endKey) break;
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months;
}

// 점 위치(0~1): 그 달 안에서 날짜의 가운데
export const dayPosition = (day: number, days: number) => (day - 0.5) / days;

// 기준일까지(포함)의 마지막 확정 일기
export function lastConfirmedOnOrBefore<T extends EntryLike>(
  entries: T[],
  anchor: string,
): T | null {
  let last: T | null = null;
  for (const e of entries) {
    if (e.status !== 'CONFIRMED' || e.date > anchor) continue;
    if (!last || e.date > last.date) last = e;
  }
  return last;
}

// 처음 보여 줄 기준일: 대화 가능한 1개월 전 → 다른 가능한 프리셋 → 마지막 확정 일기 → 오늘
export function defaultAnchor(
  presets: { preset: Preset; anchorDate: string; available: boolean }[],
  entries: EntryLike[],
  today: string,
): string {
  const usable = presets.filter((p) => p.available);
  const pick = usable.find((p) => p.preset === '1M') ?? usable[0];
  if (pick) return pick.anchorDate;
  return lastConfirmedOnOrBefore(entries, today)?.date ?? today;
}

// 최근 대화 시간: 방금 · N분 전 · N시간 전 · 어제 · N일 전 · M월 D일 (KST 날짜 기준)
export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const kst = (ms: number) =>
    new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const days = Math.round(
    (Date.parse(`${kst(now)}T00:00:00Z`) - Date.parse(`${kst(t)}T00:00:00Z`)) /
      86_400_000,
  );
  if (days === 0) return `${Math.floor(min / 60)}시간 전`;
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return shortKoreanDate(kst(t));
}
