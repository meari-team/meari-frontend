import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useChecklist, useEntry } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { DeleteEntrySection } from '@/features/entries/DeleteEntrySection';
import { ConfirmedView } from '@/features/today/ConfirmedView';
import { DraftEditor } from '@/features/today/DraftEditor';
import { InputStage } from '@/features/today/InputStage';
import { QuestionsStage } from '@/features/today/QuestionsStage';
import { ReadyStage } from '@/features/today/ReadyStage';
import { stageOf } from '@/features/today/stage';
import { TodayTitle } from '@/features/today/TodayTitle';
import { normalizeEntryDate } from '@/lib/dates';
import { warm } from '@/theme';

// 오늘의 일기. 서버의 일기 상태에 따라 단계를 그린다 (prd.md §7-1)
// ?date=YYYY-MM-DD로 지난 날짜도 쓸 수 있다 (미래·잘못된 값은 오늘)
// ?edit=<아무 값>이면 확정본 수정으로 바로 연다 (일기 상세의 [수정하기])
export default function TodayScreen() {
  const params = useLocalSearchParams<{ date?: string; edit?: string }>();
  const date = normalizeEntryDate(params.date);

  // 서버 상태만으로 정할 수 없는 화면: 직접 쓰기(READY), 확정본 수정(CONFIRMED)
  const [manual, setManual] = useState<{
    date: string;
    mode: 'write' | 'edit';
  } | null>(null);
  // 렌더 중에 edit 파라미터가 새로 온 것을 보고 수정 모드로 (effect 대신)
  const [seenEdit, setSeenEdit] = useState<string | undefined>(undefined);
  if (params.edit && params.edit !== seenEdit) {
    setSeenEdit(params.edit);
    setManual({ date, mode: 'edit' });
  }
  const mode = manual?.date === date ? manual.mode : null;

  const entry = useEntry(date, { pollWhilePending: true });
  const checklist = useChecklist();
  // 다른 탭처럼 기본 헤더 대신 큰 제목 (지난 날짜면 날짜가 제목)
  const title = <TodayTitle date={date} />;

  if (entry.isPending || checklist.isPending) {
    return (
      <Screen edges={['top']} backgroundColor={warm.background}>
        {title}
        <StateView status="loading" />
      </Screen>
    );
  }
  if (entry.isError || checklist.isError) {
    return (
      <Screen edges={['top']} backgroundColor={warm.background}>
        {title}
        <StateView
          status="error"
          message={errorMessage(entry.error ?? checklist.error)}
          onRetry={() => {
            void entry.refetch();
            void checklist.refetch();
          }}
        />
      </Screen>
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
  } else if (
    mode === 'write' &&
    (stage === 'input' || stage === 'questions' || stage === 'ready')
  ) {
    // AI 없이 직접 쓰기: 입력·질문·준비 어느 단계에서든 (일기가 아직 없어도) 바로 쓴다
    body = (
      <DraftEditor
        date={date}
        entry={data ?? null}
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
        date={date}
        entry={data}
        categories={checklist.data}
        onEdit={() => setManual({ date, mode: 'edit' })}
      />
    );
  }

  // AI 단계부터는 작성 중이든 확정이든 지울 수 있다. 지우면 빈 입력 화면으로 돌아간다.
  // 입력 단계(DRAFT)는 사진만 올려도 서버에 생기는 초안이라 사용자에겐 아직 일기가 아니다 → 숨김
  const remove =
    data && !mode && stage !== 'input' ? (
      <DeleteEntrySection key={data.id} date={date} />
    ) : null;

  if (!body) {
    // 입력 단계는 아래 고정 버튼이 있어 화면 전체를 직접 그린다.
    // 날짜가 바뀌면 입력 상태를 새로 시작한다
    return (
      <InputStage
        key={date}
        date={date}
        entry={data}
        categories={checklist.data}
        onWriteMyself={() => setManual({ date, mode: 'write' })}
      />
    );
  }

  return (
    <Screen edges={['top']} backgroundColor={warm.background}>
      {title}
      {body}
      {remove}
    </Screen>
  );
}
