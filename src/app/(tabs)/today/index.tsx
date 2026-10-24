import { Stack, useLocalSearchParams } from 'expo-router';
import { useChecklist, useEntry } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { InputStage } from '@/features/today/InputStage';
import { stageOf } from '@/features/today/stage';
import { formatKoreanDate, normalizeEntryDate, todayKst } from '@/lib/dates';

// 오늘의 일기. ?date=YYYY-MM-DD로 지난 날짜도 쓸 수 있다 (미래·잘못된 값은 오늘)
export default function TodayScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = normalizeEntryDate(params.date);
  const title = date === todayKst() ? '오늘의 일기' : formatKoreanDate(date);

  const entry = useEntry(date, { pollWhilePending: true });
  const checklist = useChecklist();

  const header = <Stack.Screen options={{ title }} />;

  if (entry.isPending || checklist.isPending) {
    return (
      <>
        {header}
        <StateView status="loading" />
      </>
    );
  }
  if (entry.isError || checklist.isError) {
    return (
      <>
        {header}
        <StateView
          status="error"
          message={errorMessage(entry.error ?? checklist.error)}
          onRetry={() => {
            void entry.refetch();
            void checklist.refetch();
          }}
        />
      </>
    );
  }

  const stage = stageOf(entry.data);
  return (
    <>
      {header}
      {stage === 'input' ? (
        <Screen edges={[]}>
          <InputStage
            // 날짜가 바뀌면 입력 상태를 새로 시작한다
            key={date}
            date={date}
            entry={entry.data}
            categories={checklist.data}
          />
        </Screen>
      ) : (
        <Placeholder title="다음 단계" ticket="MEA-13" />
      )}
    </>
  );
}
