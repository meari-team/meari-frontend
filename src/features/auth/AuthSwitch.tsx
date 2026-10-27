import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, warm } from '@/theme';

// "아직 회원이 아니신가요? 회원가입"처럼 로그인·회원가입을 오가는 한 줄
export function AuthSwitch({
  question,
  action,
  onPress,
  testID,
}: {
  question: string;
  action: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.question}>{question}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="link"
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 20 },
  question: { fontFamily: fonts.medium, fontSize: 13, color: warm.tan },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.6 },
});
