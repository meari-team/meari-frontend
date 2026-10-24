import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '과거의 나' }} />
      <Stack.Screen name="confirm" options={{ title: '시점 확인' }} />
      <Stack.Screen name="[sessionId]" options={{ title: '과거의 나' }} />
    </Stack>
  );
}
