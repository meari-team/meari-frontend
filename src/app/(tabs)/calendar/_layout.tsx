import { Stack } from 'expo-router';

// 캘린더는 화면 안에 큰 "2026. 10" 제목이 있어 기본 헤더를 숨긴다
export default function Layout() {
  return <Stack screenOptions={{ title: '캘린더', headerShown: false }} />;
}
