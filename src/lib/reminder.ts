// 일기 알림: 매일 오후 9시(KST). 미리 며칠치를 예약해 두고 앱을 열 때마다 다시 맞춘다
export const REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 예약할 시각들 (epoch ms). 오늘 일기를 이미 썼거나 오늘 9시가 지났으면 내일부터
// KST 21:00 = 같은 날 UTC 12:00 (KST는 서머타임이 없다)
export function reminderTimes(
  now: number,
  todayWritten: boolean,
  days = REMINDER_DAYS,
): number[] {
  const today = new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
  const todayNine = Date.parse(`${today}T12:00:00Z`);
  const skipToday = todayWritten || todayNine <= now;
  const first = skipToday ? todayNine + DAY_MS : todayNine;
  return Array.from({ length: days }, (_, i) => first + i * DAY_MS);
}
