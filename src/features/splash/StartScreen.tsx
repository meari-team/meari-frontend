import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdSlot } from '@/components/AdSlot';
import { splashState } from '@/lib/splash';
import { colors, radius, spacing } from '@/theme';

// 앱을 처음 켤 때만 잠깐 보이는 시작 화면: 메아리 이름 + 광고 자리.
// 토큰 확인(authReady)이 끝나고 3초가 지나거나 건너뛰면 onDone
export function StartScreen({
  authReady,
  onDone,
}: {
  authReady: boolean;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const state = splashState(elapsed, { authReady, skipped });

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (state.done) onDone();
  }, [state.done, onDone]);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
      testID="start-screen"
    >
      <View style={styles.top}>
        <Pressable
          testID="splash-skip"
          accessibilityRole="button"
          accessibilityLabel={
            state.canSkip ? '건너뛰기' : `${state.remaining}초 뒤 넘어가요`
          }
          accessibilityState={{ disabled: !state.canSkip }}
          disabled={!state.canSkip}
          onPress={() => setSkipped(true)}
          style={({ pressed }) => [
            styles.skip,
            !state.canSkip && styles.skipWaiting,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.skipText}>건너뛰기 {state.remaining}</Text>
        </Pressable>
      </View>

      <View style={styles.brand}>
        <Text style={styles.title}>메아리</Text>
        <Text style={styles.subtitle}>사진 몇 장으로 남기는 오늘</Text>
      </View>

      <AdSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  top: { alignItems: 'flex-end' },
  skip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipWaiting: { opacity: 0.6 },
  skipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  pressed: { opacity: 0.7 },
  brand: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  title: { fontSize: 40, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textMuted },
});
