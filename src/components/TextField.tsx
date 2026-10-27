import type { ComponentRef, Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing } from '@/theme';

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
        placeholderTextColor={colors.textMuted}
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

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  hint: { fontSize: 12, color: colors.textMuted },
  error: { fontSize: 12, color: colors.danger },
});
