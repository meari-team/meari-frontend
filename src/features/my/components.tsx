import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { DIARY_STYLES } from './logic';

type IconName = ComponentProps<typeof Ionicons>['name'];

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

// 설정 한 줄: 아이콘 · 제목(설명) · 현재값 · ›. onPress가 없으면 정보만 보여 준다
export function SettingsRow({
  icon,
  tint = colors.primary,
  title,
  description,
  value,
  onPress,
  last = false,
  danger = false,
  expanded,
  testID,
}: {
  icon: IconName;
  tint?: string;
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
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? colors.dangerSoft : `${tint}1F` },
        ]}
      >
        <Ionicons name={icon} size={18} color={danger ? colors.danger : tint} />
      </View>
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
      {onPress ? (
        <Ionicons name={chevron} size={18} color={colors.disabled} />
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

// 기록 요약 한 칸
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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
          color={selected ? colors.primary : colors.disabled}
        />
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionHint}>{option.hint}</Text>
      </View>
      <Text style={styles.optionExample}>“{option.example}”</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  groupCard: {
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    minHeight: 56,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDescription: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  rowValue: { fontSize: 14, color: colors.textMuted, maxWidth: 140 },
  dangerText: { color: colors.danger },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted },
  option: {
    gap: spacing.xs + 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionHint: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
  optionExample: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    paddingLeft: 28,
  },
});
