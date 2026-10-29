import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
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
  // 펼침 행이면 › 대신 ⌄/⌃
  expanded?: boolean;
  testID?: string;
}) {
  const chevron =
    expanded === undefined
      ? 'chevron-forward'
      : expanded
        ? 'chevron-up'
        : 'chevron-down';
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
      {onPress ? <Ionicons name={chevron} size={18} color={warm.tan} /> : null}
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

// 문체 선택 카드: 이름 · 설명 · 같은 하루를 그 문체로 쓴 예시
export function StyleOption({
  option,
  selected,
  disabled,
  onPress,
}: {
  option: (typeof DIARY_STYLES)[number];
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${option.label} 문체, ${option.hint}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
      testID={`style-${option.value}`}
    >
      <View style={styles.optionHeader}>
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selected ? warm.brown : warm.sand}
        />
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionHint}>{option.hint}</Text>
      </View>
      <Text style={styles.optionExample}>“{option.example}”</Text>
    </Pressable>
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
  option: {
    gap: 6,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: warm.sand,
    backgroundColor: warm.field,
  },
  optionSelected: { borderColor: warm.brown, backgroundColor: warm.background },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionLabel: { fontFamily: fonts.bold, fontSize: 15, color: warm.black },
  optionHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: warm.tan,
    flexShrink: 1,
  },
  optionExample: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: warm.ink,
    paddingLeft: 28,
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
