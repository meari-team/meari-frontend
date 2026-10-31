import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnswer, useGenerate, type QuestionDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { colors, fonts, warm } from '@/theme';
import { BusyView, GENERATE_MESSAGES } from './BusyView';
import { answersPayload } from './stage';

type Props = {
  date: string;
  questions: QuestionDto[];
  // AI 없이 바로 직접 쓰기로
  onWriteMyself: () => void;
};

const ANSWER_MAX = 2000;

// 2단계: AI가 사진만으로 모르는 것(누구와·왜 등)을 묻는다. 최대 2개
// 답한 것만 보내고, 나머지는 건너뛴 것으로 바로 일기를 만든다
export function QuestionsStage({ date, questions, onWriteMyself }: Props) {
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
      {/* 저장 전 화면처럼: 작은 테두리 알약 + 갈색 안내 */}
      <View style={styles.note}>
        <Text style={styles.chip}>AI의 질문</Text>
        <Text style={styles.lead}>
          사진만으로는 알기 어려운 게 있어요. 아는 만큼만 알려 주세요.
        </Text>
      </View>

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

      <View style={styles.buttons}>
        <Button
          title="답하고 일기 만들기"
          onPress={() => submit(true)}
          disabled={!hasAnswer}
          loading={answer.isPending}
        />
        <Button
          title="건너뛰고 그냥 만들기"
          variant="secondary"
          onPress={() => submit(false)}
        />
        <Button
          title="AI 없이 직접 쓸게요"
          variant="ghost"
          onPress={onWriteMyself}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  note: { gap: 8, marginTop: -4 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: warm.sand,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: warm.ink,
    overflow: 'hidden',
  },
  lead: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  buttons: { gap: 14 },
  error: { fontSize: 14, color: colors.danger },
});
