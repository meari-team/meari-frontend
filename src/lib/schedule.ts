// 일정 입력 규칙 (백엔드 CreateScheduleDto와 같다)
export const SCHEDULE_TITLE_MAX = 50;
export const SCHEDULES_PER_DAY_MAX = 20;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// "9:5", "0930", "9시 30분" 같은 입력을 HH:mm으로 맞춘다. 비우면 null(시간 없음), 틀리면 undefined
export function normalizeTime(input: string): string | null | undefined {
  const raw = input.trim();
  if (raw === '') return null;
  let h: number;
  let m: number;
  const colon = raw.match(/^(\d{1,2})\s*[:시]\s*(\d{1,2})?\s*분?$/);
  const digits = raw.match(/^(\d{3,4})$/);
  if (colon) {
    h = Number(colon[1]);
    m = colon[2] === undefined ? 0 : Number(colon[2]);
  } else if (digits) {
    const v = digits[1].padStart(4, '0');
    h = Number(v.slice(0, 2));
    m = Number(v.slice(2));
  } else {
    return undefined;
  }
  if (h > 23 || m > 59) return undefined;
  const out = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return TIME_RE.test(out) ? out : undefined;
}

export function validateTitle(title: string): string | null {
  const t = title.trim();
  if (t.length === 0) return '일정 이름을 적어 주세요.';
  if (t.length > SCHEDULE_TITLE_MAX)
    return `일정 이름은 ${SCHEDULE_TITLE_MAX}자까지 쓸 수 있어요.`;
  return null;
}

// 날짜별로 개수를 센다 (월간 표시용)
export function countByDate(items: { date: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { date } of items) counts.set(date, (counts.get(date) ?? 0) + 1);
  return counts;
}
