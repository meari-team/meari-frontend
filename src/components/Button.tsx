import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { fonts, warm } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

// 웜톤 알약 버튼. primary: 황갈색 · secondary: 테두리만 · ghost: 갈색 글자 · danger: 차분한 빨강(되돌릴 수 없는 작업)
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: Props) {
  const inactive = disabled || loading;
  const filled = variant === 'primary' || variant === 'danger';
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
        inactive && variant === 'secondary' && styles.dim,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? warm.field : warm.brown} />
      ) : (
        <Text
          style={[
            styles.label,
            filled
              ? styles.filledLabel
              : variant === 'secondary'
                ? styles.secondaryLabel
                : styles.ghostLabel,
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
    minHeight: 47,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: warm.tan },
  secondary: {
    backgroundColor: warm.field,
    borderWidth: 1.5,
    borderColor: warm.tan,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: warm.sunday },
  disabled: { opacity: 0.5 },
  dim: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.semibold, fontSize: 16 },
  filledLabel: { color: warm.field },
  secondaryLabel: { color: warm.brown },
  ghostLabel: { color: warm.brown },
});
