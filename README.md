# meari-frontend

메아리 앱 — React Native · Expo SDK 58 · expo-router

설계 문서는 [meari-docs](https://github.com/meari-team/meari-docs) (PRD · API · 화면 상태 · 개발 플로우).

## 시작하기

```bash
npm ci
cp .env.example .env   # EXPO_PUBLIC_API_URL 설정 (아래 참고)
npx expo start         # Expo Go(SDK 58) 또는 시뮬레이터로 실행
```

`EXPO_PUBLIC_API_URL`은 백엔드 주소(호스트만, `/api/v1` 제외)다.
- iOS 시뮬레이터: `http://localhost:3000`
- 실기기(같은 Wi-Fi): `http://<맥의 LAN IP>:3000` — `ipconfig getifaddr en0`
- 같은 Wi-Fi가 안 되면 `npx expo start --tunnel` (Expo 로그인 필요) 또는 `--tunnel ngrok`

## API 타입

백엔드 `openapi.json`에서 타입을 만든다. 백엔드 API가 바뀌면 다시 실행해 `src/api/schema.d.ts`를 커밋한다.

```bash
npm run api:types                                   # ../meari-backend/openapi.json 사용
OPENAPI_SPEC=/다른/경로/openapi.json npm run api:types
```

- 호출은 `src/api/client.ts`의 `api`(openapi-fetch) + `unwrap()`으로 한다. 경로·요청·응답 타입이 자동으로 맞춰진다.
- 401을 받으면 토큰을 지우고 로그인 화면으로 돌아간다 (로그인·가입 API 제외).

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
- `src/app/(auth)` — 로그인·가입 (로그아웃 상태에서만 접근)
- `src/app/(tabs)` — 오늘의 일기 · 캘린더 · 과거의 나 · 마이페이지 (로그인 상태에서만 접근)
- `src/api` — API 클라이언트, 생성된 타입, TanStack Query 훅
- `src/stores` — zustand (인증), `src/components` — 공통 컴포넌트, `src/lib` — 토큰 저장 등

## 브랜치

`develop`(기본) ← `feat/MEA-N-*` PR (squash) · `main` ← `develop` 릴리스 PR (merge commit). 자세한 규칙은 meari-docs의 `dev-flow.md` §4.
