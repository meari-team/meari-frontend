import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/errors';
import { StartScreen } from '@/features/splash/StartScreen';
import { SPLASH_AD } from '@/lib/env';
import { useAuth } from '@/stores/auth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx는 다시 시도해도 같은 결과라 재시도하지 않는다
      retry: (count, error) =>
        !(error instanceof ApiError && error.code !== 'NETWORK_ERROR') &&
        count < 2,
    },
  },
});

export default function RootLayout() {
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);
  // 시작 화면(광고 자리)은 앱을 처음 켤 때 한 번만. 이 레이아웃은 앱이 살아 있는 동안 다시 마운트되지 않는다
  const [starting, setStarting] = useState(SPLASH_AD);
  const finishStart = useCallback(() => setStarting(false), []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // 시작 화면이 있으면 바로 기본 스플래시를 걷고 시작 화면이 토큰 확인을 기다린다
    if (starting || status !== 'loading') SplashScreen.hideAsync();
    // 로그아웃(401 포함)되면 이전 사용자의 캐시를 지운다
    if (status === 'signedOut') queryClient.clear();
  }, [status, starting]);

  if (starting) {
    return (
      <>
        <StatusBar style="dark" />
        <StartScreen authReady={status !== 'loading'} onDone={finishStart} />
      </>
    );
  }
  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          {/* 일기 상세: 캘린더와 과거의 나(근거 칩)가 함께 연다 */}
          <Stack.Screen
            name="entry/[date]"
            options={{ headerShown: true, headerBackTitle: '뒤로' }}
          />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
