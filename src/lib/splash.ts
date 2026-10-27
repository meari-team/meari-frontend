// 앱 시작 화면 시간 계산. 화면과 분리해 테스트한다

// 이만큼 보여 준 뒤 넘어간다 (시안에 건너뛰기 버튼이 없어 짧게)
export const SPLASH_MS = 1500;

// 토큰 확인(authReady)이 끝나기 전에는 넘어가지 않는다 — 넘어갈 곳(로그인/홈)을 아직 모른다
export function splashDone(elapsed: number, authReady: boolean): boolean {
  return authReady && elapsed >= SPLASH_MS;
}
