// 과거의 나 화면의 순수 로직 (prd.md §7-2)
// node --test로 바로 돌리기 위해 다른 앱 모듈을 import하지 않는다

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDateString = (v: string) => {
  if (!DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export type Preset = '1W' | '1M' | '3M' | '6M' | '1Y';

export const PRESET_LABELS: Record<Preset, string> = {
  '1W': '1주 전',
  '1M': '1개월 전',
  '3M': '3개월 전',
  '6M': '6개월 전',
  '1Y': '1년 전',
};

// "10월 10일" (요일 없이, 대화 제목·배지용)
export function shortKoreanDate(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;
}

export const pastSelfTitle = (anchorDate: string) =>
  `${shortKoreanDate(anchorDate)}의 나`;

// 7일 미만이면 비활성 안내 문구 (없으면 null)
export function availabilityHint(
  recordCount: number,
  required: number,
): string | null {
  return recordCount >= required
    ? null
    : `기록이 ${required}일 이상 쌓이면 대화할 수 있어요 (${recordCount}/${required})`;
}

// 직접 고른 날짜 검증
export function validateAnchor(
  input: string,
  today: string,
): { ok: true; date: string } | { ok: false; message: string } {
  const value = input.trim();
  if (!isDateString(value))
    return { ok: false, message: '날짜는 2026-09-24 형식으로 적어 주세요.' };
  if (value > today)
    return { ok: false, message: '오늘 이후 날짜는 고를 수 없어요.' };
  return { ok: true, date: value };
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
