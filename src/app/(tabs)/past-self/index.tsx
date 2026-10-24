import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { useChatSessions, usePresets } from '@/api/past-self';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StateView } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import {
  PRESET_LABELS,
  availabilityHint,
  pastSelfTitle,
  shortKoreanDate,
  validateAnchor,
} from '@/features/past-self/logic';
import { isDateString, todayKst } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

const REQUIRED = 7;

const confirmHref = (anchorDate: string) =>
  ({ pathname: '/past-self/confirm', params: { anchorDate } }) as const;

// 과거의 나: 시점 고르기 + 이전 대화 (prd.md §7-2, 기획안 그림 3)
export default function PastSelfHome() {
  const params = useLocalSearchParams<{ anchorDate?: string }>();
  const presets = usePresets();
  const sessions = useChatSessions();
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // 일기 상세의 [이때의 나와 대화하기]에서 날짜를 들고 오면 바로 시점 확인으로
  if (isDateString(params.anchorDate)) {
    return <Redirect href={confirmHref(params.anchorDate)} />;
  }

  if (presets.isPending) return <StateView status="loading" />;
  if (presets.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(presets.error)}
        onRetry={() => void presets.refetch()}
      />
    );
  }

  const submitCustom = () => {
    const result = validateAnchor(custom, todayKst());
    if (!result.ok) return setCustomError(result.message);
    setCustomError(null);
    router.push(confirmHref(result.date));
  };

  return (
    <Screen edges={[]}>
      <Text style={styles.lead}>
        고른 날까지의 기록만으로, 그때의 나와 대화해요.
      </Text>

      <Section title="언제의 나와 이야기할까요?">
        {presets.data.map((p) => {
          const hint = availabilityHint(p.recordCount, REQUIRED);
          return (
            <Pressable
              key={p.preset}
              testID={`preset-${p.preset}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !p.available }}
              disabled={!p.available}
              onPress={() => router.push(confirmHref(p.anchorDate))}
              style={({ pressed }) => [
                styles.preset,
                !p.available && styles.presetDisabled,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.presetText}>
                <Text style={styles.presetLabel}>
                  {PRESET_LABELS[p.preset]}{' '}
                  <Text style={styles.presetDate}>
                    ({shortKoreanDate(p.anchorDate)})
                  </Text>
                </Text>
                <Text style={styles.presetHint}>
                  {hint ?? `기록 ${p.recordCount}편`}
                </Text>
              </View>
              {p.available ? (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              ) : null}
            </Pressable>
          );
        })}
      </Section>

      <Section
        title="직접 고르기"
        hint="그날까지의 기록이 7일 이상이어야 해요."
      >
        <TextField
          label="날짜"
          value={custom}
          onChangeText={(v) => {
            setCustom(v);
            setCustomError(null);
          }}
          placeholder="2026-09-24"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          onSubmitEditing={submitCustom}
          error={customError}
          testID="custom-anchor"
        />
        <Button
          title="이 날의 나와 대화하기"
          variant="ghost"
          disabled={custom.trim().length === 0}
          onPress={submitCustom}
        />
      </Section>

      <Section title="이전 대화">
        {sessions.isPending ? (
          <Text style={styles.muted}>불러오는 중…</Text>
        ) : sessions.isError ? (
          <View style={styles.row}>
            <Text style={styles.error}>{errorMessage(sessions.error)}</Text>
            <Button
              title="다시 시도"
              variant="ghost"
              onPress={() => void sessions.refetch()}
            />
          </View>
        ) : sessions.data.length === 0 ? (
          <Text style={styles.muted}>아직 나눈 대화가 없어요.</Text>
        ) : (
          sessions.data.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/past-self/[sessionId]',
                  params: { sessionId: s.id, anchorDate: s.anchorDate },
                })
              }
              style={({ pressed }) => [
                styles.session,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sessionTitle}>
                {pastSelfTitle(s.anchorDate)}
              </Text>
              <Text style={styles.sessionPreview} numberOfLines={1}>
                {s.lastMessagePreview ?? '아직 메시지가 없어요'}
              </Text>
            </Pressable>
          ))
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  presetDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
  presetText: { flex: 1, gap: 2 },
  presetLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  presetDate: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  presetHint: { fontSize: 13, color: colors.textMuted },
  muted: { fontSize: 14, color: colors.textMuted },
  error: { fontSize: 14, color: colors.danger },
  row: { gap: spacing.xs },
  session: {
    gap: 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sessionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  sessionPreview: { fontSize: 13, color: colors.textMuted },
});
