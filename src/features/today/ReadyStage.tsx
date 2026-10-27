import { StyleSheet, Text, View } from 'react-native';
import { useGenerate } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';
import { BusyView, GENERATE_MESSAGES } from './BusyView';

type Props = { date: string; onWriteMyself: () => void };

// 질문이 없거나 다 답한 상태. AI에게 맡기거나 직접 쓴다
export function ReadyStage({ date, onWriteMyself }: Props) {
  const generate = useGenerate(date);
  if (generate.isPending) return <BusyView messages={GENERATE_MESSAGES} />;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>준비됐어요</Text>
      <Text style={styles.lead}>
        사진과 메모로 AI가 오늘의 일기 초안을 써 줄게요. 다 쓴 뒤에 고칠 수
        있어요.
      </Text>
      {generate.isError ? (
        <Text style={styles.error}>{errorMessage(generate.error)}</Text>
      ) : null}
      <Button title="일기 만들기" onPress={() => generate.mutate({})} />
      <Button title="직접 쓸게요" variant="ghost" onPress={onWriteMyself} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingTop: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  error: { fontSize: 14, color: colors.danger },
});
