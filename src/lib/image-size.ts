// 업로드 전 리사이즈 규칙 (순수 함수 — 테스트 대상). api.md §5
export const MAX_PHOTOS = 3;
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.7;

// 긴 변이 MAX_EDGE를 넘을 때만 줄인다 (작은 사진은 키우지 않음)
export function resizeTarget(
  width: number,
  height: number,
): { width: number } | { height: number } | null {
  if (width <= 0 || height <= 0) return null;
  if (Math.max(width, height) <= MAX_EDGE) return null;
  return width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE };
}
