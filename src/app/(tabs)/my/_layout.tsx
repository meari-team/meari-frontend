import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '마이페이지' }} />
      <Stack.Screen name="checklist" options={{ title: '체크리스트 편집' }} />
      <Stack.Screen name="category" options={{ title: '카테고리' }} />
      <Stack.Screen name="withdraw" options={{ title: '회원 탈퇴' }} />
    </Stack>
  );
}
