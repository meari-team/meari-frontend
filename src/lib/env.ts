// 실기기에서는 localhost 대신 맥의 LAN IP를 넣는다 (예: http://192.168.0.10:3000).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
