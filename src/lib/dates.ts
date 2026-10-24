// 기록일은 KST 기준 YYYY-MM-DD (백엔드와 같은 규칙). KST는 서머타임이 없어 +9시간이면 된다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function todayKst(now = Date.now()): string {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// 라우트 파라미터 등에서 받은 날짜를 검증한다. 형식이 틀리거나 미래면 오늘
export function normalizeEntryDate(value: unknown, today = todayKst()): string {
  return isDateString(value) && value <= today ? value : today;
}

// "10월 24일 (금)"
export function formatKoreanDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}
