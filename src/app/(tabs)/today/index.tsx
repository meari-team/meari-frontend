import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useChecklist, useEntry } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { ConfirmedView } from '@/features/today/ConfirmedView';
import { DraftEditor } from '@/features/today/DraftEditor';
import { InputStage } from '@/features/today/InputStage';
import { QuestionsStage } from '@/features/today/QuestionsStage';
import { ReadyStage } from '@/features/today/ReadyStage';
import { stageOf } from '@/features/today/stage';
import { formatKoreanDate, normalizeEntryDate, todayKst } from '@/lib/dates';

// 오늘의 일기. 서버의 일기 상태에 따라 단계를 그린다 (prd.md §7-1)
// ?date=YYYY-MM-DD로 지난 날짜도 쓸 수 있다 (미래·잘못된 값은 오늘)
export default function TodayScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = normalizeEntryDate(params.date);
  const title = date === todayKst() ? '오늘의 일기' : formatKoreanDate(date);

  // 서버 상태만으로 정할 수 없는 화면: 직접 쓰기(READY), 확정본 수정(CONFIRMED)
  const [manual, setManual] = useState<{
    date: string;
    mode: 'write' | 'edit';
  } | null>(null);
  const mode = manual?.date === date ? manual.mode : null;

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

  const data = entry.data;
  const stage = stageOf(data);
  const close = () => setManual(null);

  let body;
  if (data && mode === 'edit' && stage === 'confirmed') {
    body = (
      <DraftEditor
        date={date}
        entry={data}
        mode="edit"
        onDone={close}
        onCancel={close}
      />
    );
  } else if (data && mode === 'write' && stage === 'ready') {
    body = (
      <DraftEditor
        date={date}
        entry={data}
        mode="write"
        onDone={close}
        onCancel={close}
      />
    );
  } else if (stage === 'questions' && data) {
    body = (
      <QuestionsStage
        key={data.updatedAt}
        date={date}
        questions={data.questions}
      />
    );
  } else if (stage === 'ready') {
    body = (
      <ReadyStage
        date={date}
        onWriteMyself={() => setManual({ date, mode: 'write' })}
      />
    );
  } else if (stage === 'draft' && data) {
    body = (
      <DraftEditor key={data.updatedAt} date={date} entry={data} mode="draft" />
    );
  } else if (stage === 'confirmed' && data) {
    body = (
      <ConfirmedView
        entry={data}
        categories={checklist.data}
        onEdit={() => setManual({ date, mode: 'edit' })}
      />
    );
  } else {
    // 날짜가 바뀌면 입력 상태를 새로 시작한다
    body = (
      <InputStage
        key={date}
        date={date}
        entry={data}
        categories={checklist.data}
      />
    );
  }

  return (
    <>
      {header}
      <Screen edges={[]}>{body}</Screen>
    </>
  );
}
