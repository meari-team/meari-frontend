import type { EntryDto } from '@/api/entries';

// 오늘의 일기 화면은 서버의 일기 상태로 단계를 정한다 (prd.md §7-1)
export type TodayStage =
  'input' | 'questions' | 'ready' | 'draft' | 'confirmed';

export function stageOf(
  entry: Pick<EntryDto, 'status'> | null | undefined,
): TodayStage {
  switch (entry?.status) {
    case 'QUESTIONING':
      return 'questions';
    case 'READY':
      return 'ready';
    case 'GENERATED':
      return 'draft';
    case 'CONFIRMED':
      return 'confirmed';
    default:
      return 'input'; // 일기 없음, DRAFT
  }
}

// 분석하기: 올라간 사진이 1장 이상이고, 올리는 중인 사진이 없어야 한다
export function canAnalyze(p: {
  uploaded: number;
  uploading: number;
}): boolean {
  return p.uploaded >= 1 && p.uploading === 0;
}

// 입력은 두 단계: 1 사진 + 한 줄 → 2 오늘 한 일 체크(선택) → 분석
export type InputStep = 1 | 2;

export type InputFooter = {
  primary: string;
  enabled: boolean;
  // 2단계에서 아무것도 안 골랐을 때만 [건너뛰기]를 같이 보여 준다
  skip: boolean;
  hint: string | null;
};

// 입력 단계 아래 고정 버튼. 1단계 [다음]도 분석 조건과 같다 (사진 1장 이상, 올리는 중 없음)
export function inputFooterOf(
  step: InputStep,
  p: { uploaded: number; uploading: number; checked: number },
): InputFooter {
  const enabled = canAnalyze(p);
  if (step === 1) {
    return {
      primary: p.uploading > 0 ? '사진을 올리는 중…' : '다음',
      enabled,
      skip: false,
      hint:
        p.uploaded === 0 && p.uploading === 0
          ? '사진을 1장 이상 올려 주세요.'
          : null,
    };
  }
  return {
    primary: 'AI로 일기 만들기',
    enabled,
    skip: p.checked === 0,
    hint: null,
  };
}

// 이번에 더 고를 수 있는 사진 수
export function remainingSlots(current: number, max: number): number {
  return Math.max(0, max - current);
}

export type IndexBadge = {
  label: string;
  tone: 'info' | 'success' | 'danger';
  spinning?: boolean;
};

// 확정 후 기억 저장 상태 배지. 알아야 할 때(실패)만 — 저장 중·저장됨은 보통 상태라 숨긴다
export function indexBadgeOf(
  status: EntryDto['aiIndexStatus'],
): IndexBadge | null {
  return status === 'FAILED'
    ? { label: '기억 저장 실패 — 자동 재시도', tone: 'danger' }
    : null;
}

// 질문 답변 → PUT answers 본문. 빈 답은 보내지 않는다 (남은 질문은 "그냥 생성"으로 건너뜀)
export function answersPayload(
  drafts: Record<string, string>,
): { questionId: string; answer: string }[] {
  return Object.entries(drafts)
    .map(([questionId, text]) => ({ questionId, answer: text.trim() }))
    .filter((a) => a.answer.length > 0);
}
