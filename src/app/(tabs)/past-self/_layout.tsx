import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      {/* 첫 화면은 큰 "과거의 나" 제목이 있어 기본 헤더를 숨긴다 */}
      <Stack.Screen
        name="index"
        options={{ title: '과거의 나', headerShown: false }}
      />
      <Stack.Screen name="confirm" options={{ title: '시점 확인' }} />
      <Stack.Screen name="sessions" options={{ title: '지난 대화' }} />
      <Stack.Screen name="[sessionId]" options={{ title: '과거의 나' }} />
    </Stack>
  );
}
