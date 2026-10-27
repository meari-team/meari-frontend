// 실기기에서는 localhost 대신 맥의 LAN IP를 넣는다 (예: http://192.168.0.10:3000).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// 앱을 처음 켤 때 시작 화면(로고)을 보여 줄지. 'false'면 바로 로그인/홈
// (이름은 예전 광고 자리 시절 그대로 — 팀원 .env와 맞추려고 바꾸지 않음)
export const SPLASH_AD = process.env.EXPO_PUBLIC_SPLASH_AD !== 'false';
