import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

// 아직 구현 전인 탭 화면. 담당 티켓을 함께 표시한다.
export function Placeholder({
  title,
  ticket,
}: {
  title: string;
  ticket: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.ticket}>{ticket}에서 구현 예정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  ticket: { fontSize: 14, color: colors.textMuted },
});
