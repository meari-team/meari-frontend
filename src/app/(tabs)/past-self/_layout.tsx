import { Stack } from 'expo-router';
import { fonts, warm } from '@/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '뒤로',
        // 시안: 바탕색 머리줄에 가운데 굵은 제목 (지난 대화·대화 화면)
        headerStyle: { backgroundColor: warm.background },
        headerShadowVisible: false,
        headerTintColor: warm.ink,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 20 },
      }}
    >
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
