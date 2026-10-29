import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts, warm } from '@/theme';
import type { DIARY_STYLES } from './logic';

// 설정 묶음: 작은 제목 + 행들이 붙어 있는 카드
export function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

// 설정 한 줄: 제목(설명) · 현재값 · ›. onPress가 없으면 정보만 보여 준다
export function SettingsRow({
  title,
  description,
  value,
  onPress,
  last = false,
  danger = false,
  expanded,
  testID,
}: {
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  // 펼침 행이면 › 대신 ⌄ (펼치면 반 바퀴 돈다)
  expanded?: boolean;
  testID?: string;
}) {
  const body = (
    <>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.rowDescription}>{description}</Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress && expanded !== undefined ? (
        <TurningChevron open={expanded} />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={warm.tan} />
      ) : null}
    </>
  );
  const style = [styles.row, !last && styles.rowDivider];
  if (!onPress) {
    return (
      <View style={style} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

// 펼침 행의 ⌄: 열고 닫을 때 부드럽게 돈다
function TurningChevron({ open }: { open: boolean }) {
  const [turn] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, turn]);
  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="chevron-down" size={18} color={warm.tan} />
    </Animated.View>
  );
}

// 펼침 행 아래에 열리는 내용. 나타날 때 살짝 내려오며 보인다.
// divider: 아래에 다른 행이 이어지면 구분선
export function Expand({
  children,
  divider = false,
}: {
  children: ReactNode;
  divider?: boolean;
}) {
  const [shown] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(shown, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [shown]);
  return (
    <Animated.View
      style={[
        styles.expand,
        divider && styles.expandDivider,
        {
          opacity: shown,
          transform: [
            {
              translateY: shown.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// 기록 요약 한 칸 (시안: 이름 위, 값 아래)
export function StatTile({
  value,
  label,
  testID,
}: {
  value: string;
  label: string;
  testID?: string;
}) {
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// 문체 고르기: 알약 3개 중 하나 + 고른 문체로 같은 하루를 쓴 예시 한 장
export function StylePicker({
  options,
  value,
  disabled,
  onChange,
}: {
  options: typeof DIARY_STYLES;
  value: string;
  disabled: boolean;
  onChange: (value: (typeof DIARY_STYLES)[number]['value']) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <View style={styles.picker}>
      <View style={styles.segments} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === current.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled }}
              accessibilityLabel={`${o.label} 문체, ${o.hint}`}
              disabled={disabled}
              onPress={() => onChange(o.value)}
              style={({ pressed }) => [
                styles.segment,
                on && styles.segmentOn,
                pressed && styles.pressed,
              ]}
              testID={`style-${o.value}`}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.example}>
        <Text style={styles.exampleHint}>{current.hint}</Text>
        <Text style={styles.exampleText}>“{current.example}”</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  groupTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    paddingHorizontal: 6,
  },
  // 홈과 같은 종이 카드
  groupCard: {
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 61,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: warm.sand },
  pressed: { opacity: 0.6 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  rowDescription: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: warm.brown,
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: warm.brown,
    maxWidth: 140,
  },
  dangerText: { color: colors.danger },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: warm.tan,
    backgroundColor: warm.background,
  },
  statLabel: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  statValue: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  expand: { gap: 12, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 20 },
  expandDivider: { borderBottomWidth: 1, borderBottomColor: warm.sand },
  picker: { gap: 12 },
  segments: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: warm.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: warm.ink, borderColor: warm.ink },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: warm.brown },
  segmentTextOn: { color: warm.field },
  // 예시: 바탕색 종이 조각
  example: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: warm.background,
  },
  exampleHint: { fontFamily: fonts.semibold, fontSize: 12, color: warm.tan },
  exampleText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: warm.ink,
  },
});

// ── 마이페이지 하위 화면 공용 (웜톤 시안을 따른 카드·버튼) ──

// 종이 카드 (작은 제목·안내를 붙일 수 있다)
export function WarmCard({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <View style={warmStyles.card}>
      {title ? <Text style={warmStyles.cardTitle}>{title}</Text> : null}
      {hint ? <Text style={warmStyles.cardHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

type PillProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

// 테두리만 있는 알약 버튼 (보조 동작)
export function OutlineButton({ title, onPress, disabled, testID }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        warmStyles.pill,
        warmStyles.outline,
        disabled && warmStyles.dim,
        pressed && warmStyles.pressed,
      ]}
    >
      <Text style={warmStyles.outlineText}>{title}</Text>
    </Pressable>
  );
}

// 지우기처럼 되돌릴 수 없는 동작의 알약 버튼 (차분한 빨강)
export function DangerButton({
  title,
  onPress,
  disabled,
  loading,
  testID,
}: PillProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        warmStyles.pill,
        warmStyles.danger,
        disabled && !loading && warmStyles.dim,
        pressed && warmStyles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={warm.field} />
      ) : (
        <Text style={warmStyles.dangerText}>{title}</Text>
      )}
    </Pressable>
  );
}

// 글자만 있는 버튼 (취소·돌아가기)
export function TextButton({
  title,
  onPress,
  disabled,
  tone = 'brown',
  testID,
}: PillProps & { tone?: 'brown' | 'danger' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      testID={testID}
      style={({ pressed }) => [
        warmStyles.textButton,
        pressed && warmStyles.pressed,
      ]}
    >
      <Text
        style={[
          warmStyles.textButtonLabel,
          tone === 'danger' && warmStyles.textDanger,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const warmStyles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 20,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  cardHint: {
    marginTop: -8,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: warm.brown,
  },
  pill: {
    height: 45,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { borderWidth: 1.5, borderColor: warm.tan },
  outlineText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.brown },
  danger: { backgroundColor: warm.sunday },
  dangerText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.field },
  textButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.brown,
  },
  textDanger: { color: warm.sunday },
  dim: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
