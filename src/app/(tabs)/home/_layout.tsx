import { Stack } from 'expo-router';

// 홈은 인사말이 제목을 대신한다
export default function Layout() {
  return <Stack screenOptions={{ title: '홈', headerShown: false }} />;
}
