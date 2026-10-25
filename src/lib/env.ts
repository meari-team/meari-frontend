// 실기기에서는 localhost 대신 맥의 LAN IP를 넣는다 (예: http://192.168.0.10:3000).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// 앱을 처음 켤 때 시작 화면(광고 자리)을 보여 줄지. 'false'면 바로 로그인/홈
export const SPLASH_AD = process.env.EXPO_PUBLIC_SPLASH_AD !== 'false';
