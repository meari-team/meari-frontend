import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  color?: string; // 카테고리 색 점
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

// 선택 가능한 칩 (체크리스트 항목, 질문 보기, 근거 날짜 등)
export function Chip({
  label,
  selected = false,
  color,
  onPress,
  disabled,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md - 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, color: colors.text },
  selectedLabel: { color: colors.primary, fontWeight: '600' },
});
