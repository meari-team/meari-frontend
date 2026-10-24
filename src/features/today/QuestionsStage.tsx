import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnswer, useGenerate, type QuestionDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';
import { BusyView, GENERATE_MESSAGES } from './BusyView';
import { answersPayload } from './stage';

type Props = { date: string; questions: QuestionDto[] };

const ANSWER_MAX = 2000;

// 2단계: AI가 사진만으로 모르는 것(누구와·왜 등)을 묻는다. 최대 2개
// 답한 것만 보내고, 나머지는 건너뛴 것으로 바로 일기를 만든다
export function QuestionsStage({ date, questions }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, q.answer ?? ''])),
  );
  const answer = useAnswer(date, { refresh: false });
  const generate = useGenerate(date);
  // 답변은 저장됐는데 생성만 실패했으면, 다시 시도할 때 답변을 또 보내지 않는다 (서버는 이미 READY)
  const [answersSaved, setAnswersSaved] = useState(false);

  const submit = async (withAnswers: boolean) => {
    try {
      const answers = withAnswers ? answersPayload(drafts) : [];
      if (answers.length > 0 && !answersSaved) {
        await answer.mutateAsync(answers);
        setAnswersSaved(true);
      }
      // 남은 질문은 건너뛴 것으로 (서버는 QUESTIONING·READY 모두에서 허용)
      await generate.mutateAsync({ skipRemainingQuestions: true });
    } catch {
      // 아래에서 에러 문구를 보여 준다. 입력한 답은 그대로 둔다
    }
  };

  if (generate.isPending) return <BusyView messages={GENERATE_MESSAGES} />;

  const error = answer.error ?? generate.error;
  const hasAnswer = answersPayload(drafts).length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.lead}>
        사진만으로는 알기 어려운 게 있어요. 아는 만큼만 알려 주세요.
      </Text>

      {questions.map((q, i) => (
        <Section key={q.id} title={`${i + 1}. ${q.question}`} hint={q.reason}>
          {q.options && q.options.length > 0 ? (
            <View style={styles.options}>
              {q.options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={drafts[q.id] === option}
                  onPress={() => setDrafts((d) => ({ ...d, [q.id]: option }))}
                />
              ))}
            </View>
          ) : null}
          <TextField
            label="답변"
            value={drafts[q.id] ?? ''}
            onChangeText={(text) => setDrafts((d) => ({ ...d, [q.id]: text }))}
            maxLength={ANSWER_MAX}
            placeholder="비워 두면 건너뛰어요"
            multiline
            testID={`today-answer-${i}`}
          />
        </Section>
      ))}

      {error ? <Text style={styles.error}>{errorMessage(error)}</Text> : null}

      <Button
        title="답하고 일기 만들기"
        onPress={() => submit(true)}
        disabled={!hasAnswer}
        loading={answer.isPending}
      />
      <Button
        title="건너뛰고 그냥 만들기"
        variant="ghost"
        onPress={() => submit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  lead: { fontSize: 15, lineHeight: 22, color: colors.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { fontSize: 14, color: colors.danger },
});
