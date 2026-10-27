// 일기 한 쪽(DiaryPage) 계산. 화면과 분리해 테스트한다

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// "2026년 10월 20일 화요일"
export function longKoreanDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${WEEKDAYS[d.getUTCDay()]}요일`;
}

// 기억 상태 한 줄 (일기 아래 작은 글씨). 알아야 할 때만: 제외·실패.
// 저장 중·저장됨은 보통 상태라 보여 주지 않는다 (null)
export type MemoryLine = { label: string; failed: boolean };
export function memoryLineOf(
  status: 'NONE' | 'PENDING' | 'INDEXED' | 'FAILED',
  excluded: boolean,
): MemoryLine | null {
  if (excluded) return { label: '기억에서 제외됨', failed: false };
  if (status === 'FAILED') {
    return { label: '기억 저장 실패 · 자동으로 다시 시도해요', failed: true };
  }
  return null;
}

// 체크한 항목 이름을 카테고리 순서대로 ("러닝 · 카페 · 친구")
export function checkedLabels(
  categories: { items: { id: string; label: string }[] }[],
  checkedIds: readonly string[],
): string[] {
  const checked = new Set(checkedIds);
  return categories.flatMap((c) =>
    c.items.filter((i) => checked.has(i.id)).map((i) => i.label),
  );
}
