import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { fonts, warm } from '@/theme';

// 로그인·회원가입의 알약 모양 주 버튼
export function AuthButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={warm.field} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 45,
    borderRadius: 26,
    backgroundColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: warm.field },
});
