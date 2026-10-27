// 홈 화면의 순수 로직
// node --test로 바로 돌리기 위해 다른 앱 모듈을 import하지 않는다

type EntryStatus =
  'DRAFT' | 'QUESTIONING' | 'READY' | 'GENERATED' | 'CONFIRMED';

const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1~12

// 날짜를 일·달·해 단위로 옮긴다. 달이 바뀌어 그 날이 없으면 말일로 (3/31 - 1달 = 2/28)
export function shiftDate(
  date: string,
  by: { days?: number; months?: number; years?: number },
): string {
  if (by.days) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + by.days);
    return d.toISOString().slice(0, 10);
  }
  const [y, m, day] = date.split('-').map(Number);
  const total = y * 12 + (m - 1) + (by.months ?? 0) + (by.years ?? 0) * 12;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(day, lastDay(year, month)))}`;
}

export const monthStartOf = (date: string) => `${date.slice(0, 8)}01`;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 홈 머리말·최근 기록의 짧은 날짜: "10/28 (수)"
export function shortDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} (${WEEKDAYS[d.getUTCDay()]})`;
}

export type TodayAction = 'write' | 'continue' | 'view';

export const TODAY_ACTION_LABEL: Record<TodayAction, string> = {
  write: '오늘의 일기 쓰기',
  continue: '이어 쓰기',
  view: '전체 보기',
};

export function todayActionOf(
  status: EntryStatus | null | undefined,
): TodayAction {
  if (!status) return 'write';
  return status === 'CONFIRMED' ? 'view' : 'continue';
}

// 카드 미리보기 글: 확정본 → AI 초안 → 한 줄 설명
export function entryPreviewText(entry: {
  finalContent: string | null;
  aiDraft: string | null;
  note: string | null;
}): string | null {
  for (const text of [entry.finalContent, entry.aiDraft, entry.note]) {
    const t = text?.replace(/\s+/g, ' ').trim();
    if (t) return t;
  }
  return null;
}

// 이번 달 확정한 날 수 + 연속 기록일 (오늘을 아직 안 썼으면 어제부터 센다)
export function recordStats(
  items: { date: string; status: EntryStatus }[],
  today: string,
): { monthCount: number; streak: number } {
  const confirmed = new Set(
    items.filter((e) => e.status === 'CONFIRMED').map((e) => e.date),
  );
  const monthStart = monthStartOf(today);
  let monthCount = 0;
  for (const d of confirmed) if (d >= monthStart && d <= today) monthCount++;

  let day = confirmed.has(today) ? today : shiftDate(today, { days: -1 });
  let streak = 0;
  while (confirmed.has(day)) {
    streak++;
    day = shiftDate(day, { days: -1 });
  }
  return { monthCount, streak };
}

// 과거의 나를 아직 못 쓸 때 보여 줄 기록 수 (가장 최근 프리셋이 가장 많다)
export function pastSelfProgress(
  presets: { available: boolean; recordCount: number }[],
): { available: boolean; recordCount: number } {
  return {
    available: presets.some((p) => p.available),
    recordCount: Math.max(0, ...presets.map((p) => p.recordCount)),
  };
}

// 홈의 과거의 나 큰 버튼 3개: 1주·1개월·3개월 전 (이 순서, 없는 프리셋은 뺀다)
export const HOME_PRESETS = ['1W', '1M', '3M'] as const;
export function homePresets<T extends { preset: string }>(presets: T[]): T[] {
  return HOME_PRESETS.flatMap((key) => presets.filter((p) => p.preset === key));
}
