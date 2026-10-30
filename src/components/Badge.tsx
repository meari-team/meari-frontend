import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing, warm } from '@/theme';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'warm';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  // 웜톤: 연한 모래색 바탕 + 갈색 계열 글자
  neutral: { bg: warm.soft, fg: warm.tan },
  info: { bg: warm.soft, fg: warm.brown },
  success: { bg: warm.soft, fg: warm.ink },
  warning: { bg: 'rgba(201,138,98,0.16)', fg: warm.clay },
  danger: { bg: 'rgba(198,90,78,0.14)', fg: warm.sunday },
  // 웜톤 화면용: 오늘 표시
  warm: { bg: warm.tan, fg: warm.field },
};

type Props = {
  label: string;
  tone?: Tone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  spinning?: boolean; // 진행 중 표시
};

export function Badge({ label, tone = 'neutral', icon, spinning }: Props) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {spinning ? <ActivityIndicator size="small" color={fg} /> : null}
      {!spinning && icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: { fontFamily: fonts.semibold, fontSize: 12 },
});
