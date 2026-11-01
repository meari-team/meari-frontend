// 메아리 화면 문구. 순수 함수라 node --test로 확인한다 (다른 파일을 가져오지 않는다)

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const ymd = (date: string) => ({
  y: Number(date.slice(0, 4)),
  m: Number(date.slice(5, 7)),
  d: Number(date.slice(8, 10)),
});

// 채팅 첫 줄: 2026년 10월 18일의 나에게서 온 메아리
export function echoArrivalLabel(date: string): string {
  const { y, m, d } = ymd(date);
  return `${y}년 ${m}월 ${d}일의 나에게서 온 메아리`;
}

// 알림 발신자와 같은 표기: 2026.10.18의 나
export const echoSender = (date: string) => `${date.replaceAll('-', '.')}의 나`;

// "21:00" → "오후 9:00"
export function timeLabel(time: string): string {
  const [h, mm] = time.split(':').map(Number);
  const half = h < 12 ? '오전' : '오후';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${half} ${hour}:${String(mm).padStart(2, '0')}`;
}

// 30분 단위로 앞뒤로 (하루를 넘으면 돌아간다)
export function shiftTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// 시·분을 따로 맞춘다. 분은 그 시 안에서 돈다 (59분 → 00분)
export function shiftMinuteInHour(time: string, delta: number): string {
  const [h, m] = time.split(':').map(Number);
  const next = (((m + delta) % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(next).padStart(2, '0')}`;
}

// "21:05" → "오후 9시", "05분"
export function hourLabel(time: string): string {
  const h = Number(time.slice(0, 2));
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시`;
}
export const minuteLabel = (time: string) => `${time.slice(3, 5)}분`;

// 1~31 사이로 돌아가며
export const shiftMonthDay = (day: number, delta: number) =>
  ((((day - 1 + delta) % 31) + 31) % 31) + 1;

export function scheduleSummary(s: {
  frequency: 'WEEKLY' | 'MONTHLY';
  weekday: number;
  monthDay: number;
  time: string;
}): string {
  return s.frequency === 'WEEKLY'
    ? `매주 ${WEEKDAY_LABELS[s.weekday]}요일 ${timeLabel(s.time)}`
    : `매월 ${s.monthDay}일 ${timeLabel(s.time)}`;
}

// 다음 수신 예정: "11월 8일 (일) 오후 9:00" (사용자 시간대 기준)
export function nextRunLabel(iso: string, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  const weekday =
    WEEKDAY_LABELS[
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
    ];
  const time = `${parts.hour.padStart(2, '0')}:${parts.minute}`;
  return `${parts.month}월 ${parts.day}일 (${weekday}) ${timeLabel(time)}`;
}

// 기기 시간대 (없으면 서울)
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
  } catch {
    return 'Asia/Seoul';
  }
}
