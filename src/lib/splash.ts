// 앱 시작 화면(광고 자리) 시간 계산. 화면과 분리해 테스트한다

// 최소 이만큼 지나야 건너뛸 수 있고, 이만큼 지나면 저절로 넘어간다
export const SPLASH_MIN_MS = 1500;
export const SPLASH_AUTO_MS = 3000;

export type SplashState = {
  done: boolean; // 다음 화면으로 넘어가도 되는지
  canSkip: boolean; // 건너뛰기 버튼을 누를 수 있는지
  remaining: number; // "건너뛰기 n"의 n (초, 올림)
};

// 토큰 확인(authReady)이 끝나기 전에는 넘어가지 않는다 — 넘어갈 곳(로그인/홈)을 아직 모른다
export function splashState(
  elapsed: number,
  { authReady, skipped }: { authReady: boolean; skipped: boolean },
): SplashState {
  return {
    done: authReady && (skipped || elapsed >= SPLASH_AUTO_MS),
    canSkip: elapsed >= SPLASH_MIN_MS,
    remaining: Math.max(1, Math.ceil((SPLASH_AUTO_MS - elapsed) / 1000)),
  };
}
