import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

// danger: 되돌릴 수 없는 작업(삭제)의 최종 확인 버튼
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: Props) {
  const inactive = disabled || loading;
  const filled = variant !== 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && filled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={filled ? colors.primaryText : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            filled ? styles.filledLabel : styles.ghostLabel,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  disabled: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.8 },
  label: { fontSize: 16, fontWeight: '600' },
  filledLabel: { color: colors.primaryText },
  ghostLabel: { color: colors.primary },
});
