import type { ComponentRef, Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, fonts, warm } from '@/theme';

type Props = TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ ref, label, hint, error, style, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={warm.placeholder}
        style={[styles.input, error ? styles.inputError : null, style]}
        // 내용만큼 늘어나는 여러 줄 입력은 자체 스크롤을 끈다.
        // 켜 두면 iOS에서 입력칸이 드래그를 가져가 화면(ScrollView)이 스크롤되지 않는다.
        scrollEnabled={!input.multiline}
        // '다음'으로 다음 칸에 넘어갈 때 키보드가 내려갔다 올라오지 않게 한다
        submitBehavior={input.returnKeyType === 'next' ? 'submit' : undefined}
        {...input}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// 웜톤 입력칸: 바탕색 칸 + 모래색 테두리, 위에 작은 갈색 이름
const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  input: {
    minHeight: 47,
    borderWidth: 1.5,
    borderColor: warm.sand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: warm.field,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: warm.ink,
    // 웹에서 포커스 때 생기는 파란 테두리 제거
    outlineWidth: 0,
  },
  inputError: { borderColor: colors.danger },
  hint: { fontFamily: fonts.medium, fontSize: 11, color: warm.tan },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
});
