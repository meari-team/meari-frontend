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

// 이번에 더 고를 수 있는 사진 수
export function remainingSlots(current: number, max: number): number {
  return Math.max(0, max - current);
}

export type IndexBadge = {
  label: string;
  tone: 'info' | 'success' | 'danger';
  spinning?: boolean;
};

// 확정 후 기억 저장 상태 배지
export function indexBadgeOf(
  status: EntryDto['aiIndexStatus'],
): IndexBadge | null {
  switch (status) {
    case 'PENDING':
      return { label: '기억에 저장 중…', tone: 'info', spinning: true };
    case 'INDEXED':
      return { label: '기억에 저장됨', tone: 'success' };
    case 'FAILED':
      return { label: '기억 저장 실패 — 자동 재시도', tone: 'danger' };
    default:
      return null; // NONE: 확정 전이거나 기억에서 제외
  }
}

// 질문 답변 → PUT answers 본문. 빈 답은 보내지 않는다 (남은 질문은 "그냥 생성"으로 건너뜀)
export function answersPayload(
  drafts: Record<string, string>,
): { questionId: string; answer: string }[] {
  return Object.entries(drafts)
    .map(([questionId, text]) => ({ questionId, answer: text.trim() }))
    .filter((a) => a.answer.length > 0);
}
