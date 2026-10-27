import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      {/* 첫 화면은 큰 "마이페이지" 제목이 헤더를 대신한다 */}
      <Stack.Screen
        name="index"
        options={{ title: '마이페이지', headerShown: false }}
      />
      <Stack.Screen name="checklist" options={{ title: '체크리스트 관리' }} />
      <Stack.Screen name="category" options={{ title: '카테고리' }} />
      <Stack.Screen name="password" options={{ title: '비밀번호 변경' }} />
      <Stack.Screen name="withdraw" options={{ title: '회원 탈퇴' }} />
      <Stack.Screen name="privacy" options={{ title: '개인정보 처리방침' }} />
    </Stack>
  );
}
