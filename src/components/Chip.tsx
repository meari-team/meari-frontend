import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, warm } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  color?: string; // 카테고리 색 점
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

// 선택 가능한 알약 (오늘 한 일 고르기와 같은 모양: 모래색 테두리, 고르면 모래색 채움)
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
      // 웹은 accessibilityState를 aria 속성으로 옮기지 않아 직접 넣는다
      aria-selected={selected}
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
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: warm.sand,
  },
  selected: { backgroundColor: warm.sand, borderColor: warm.brown },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.regular, fontSize: 13, color: warm.black },
  selectedLabel: { fontFamily: fonts.semibold, color: warm.ink },
});
