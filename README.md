# meari-frontend

메아리 앱 — React Native · Expo SDK 58 · expo-router

설계 문서는 [meari-docs](https://github.com/meari-team/meari-docs) (PRD · API · 화면 상태 · 개발 플로우).

## 시작하기

```bash
npm ci
cp .env.example .env   # EXPO_PUBLIC_API_URL 설정
npx expo start         # Expo Go 또는 시뮬레이터로 실행
```

> 앱에는 `EXPO_PUBLIC_API_URL` 외에 어떤 키도 넣지 않는다. `EXPO_PUBLIC_*` 값은 앱 번들에 그대로 포함된다.

## 스크립트

| 명령 | 내용 |
|---|---|
| `npx expo start` | 개발 서버 |
| `npm run lint` | ESLint (expo + prettier) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |

패키지 추가는 `npx expo install <패키지>` (SDK 호환 버전 자동 선택).

## 구조

- `src/app/` — 화면과 레이아웃만 (expo-router 파일 기반 라우팅)
- `src/` 나머지 — 컴포넌트, 훅, API 클라이언트, 스토어

## 브랜치

`develop`(기본) ← `feat/MEA-N-*` PR (squash) · `main` ← `develop` 릴리스 PR (merge commit). 자세한 규칙은 meari-docs의 `dev-flow.md` §4.
