import { Stack } from 'expo-router';

// 다른 탭처럼 화면 안의 큰 제목을 쓰므로 기본 헤더를 숨긴다
export default function Layout() {
  return <Stack screenOptions={{ title: '오늘의 일기', headerShown: false }} />;
}
