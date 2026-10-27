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
  // 시안처럼 칸 안의 안내 글자(placeholder)가 이름 역할을 한다
  placeholder: string;
  hint?: string;
  error?: string | null;
};

// 로그인·회원가입의 알약 모양 입력칸 (시안 "graphic asset" Component 1)
export function AuthField({ ref, placeholder, hint, error, ...input }: Props) {
  return (
    <View>
      <View style={styles.pill}>
        <TextInput
          ref={ref}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          placeholderTextColor={warm.placeholder}
          style={styles.input}
          // '다음'으로 다음 칸에 넘어갈 때 키보드가 내려갔다 올라오지 않게 한다
          submitBehavior={input.returnKeyType === 'next' ? 'submit' : undefined}
          {...input}
        />
      </View>
      {error ? (
        <Text style={[styles.note, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={styles.note}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 45,
    borderRadius: 26,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: warm.ink,
  },
  note: {
    marginTop: 9,
    marginLeft: 19,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: warm.tan,
  },
  error: { color: colors.danger },
});
