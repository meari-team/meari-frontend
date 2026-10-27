// 429: 서버가 알려 준 대기 시간(초)을 함께 보여 준다
export function rateLimitMessage(details: unknown): string {
  const seconds =
    typeof details === 'object' &&
    details !== null &&
    typeof (details as { retryAfter?: unknown }).retryAfter === 'number'
      ? (details as { retryAfter: number }).retryAfter
      : null;
  if (seconds === null) return '요청이 많아요. 잠시 후 다시 시도해 주세요.';
  if (seconds < 60)
    return `요청이 많아요. ${seconds}초 뒤에 다시 시도해 주세요.`;
  if (seconds < 3600)
    return `요청이 많아요. ${Math.ceil(seconds / 60)}분 뒤에 다시 시도해 주세요.`;
  return `오늘 쓸 수 있는 횟수를 다 썼어요. ${Math.ceil(seconds / 3600)}시간 뒤에 다시 시도해 주세요.`;
}
