// 마이페이지 화면의 순수 로직 (서버 규칙: meari-backend ChecklistDto·UpdateMeDto)

export const NICKNAME_MAX = 20;
export const CATEGORY_NAME_MAX = 20;
export const ITEM_LABEL_MAX = 20;
export const ITEMS_MAX = 10;
export const CATEGORIES_MAX = 20;

// 카테고리 색 후보. 기본 체크리스트 6색 + 4색
export const CATEGORY_COLORS = [
  '#4CAF50',
  '#FF9800',
  '#5C6BC0',
  '#29B6F6',
  '#EC407A',
  '#FFCA28',
  '#8D6E63',
  '#26A69A',
  '#AB47BC',
  '#78909C',
] as const;

export type DiaryStyle = 'PLAIN' | 'EMOTIONAL' | 'SUMMARY';

// example: 같은 하루를 문체마다 어떻게 쓰는지 보여 주는 예시 문장
export const DIARY_STYLES: {
  value: DiaryStyle;
  label: string;
  hint: string;
  example: string;
}[] = [
  {
    value: 'PLAIN',
    label: '담백',
    hint: '있었던 일을 간결하게',
    example: '친구와 한강을 걸었다. 바람이 시원했고 커피가 맛있었다.',
  },
  {
    value: 'EMOTIONAL',
    label: '감성',
    hint: '느낌과 분위기를 살려서',
    example:
      '친구와 나란히 한강을 걸었다. 볼을 스치는 바람 덕분에 손에 든 커피가 유난히 맛있었다.',
  },
  {
    value: 'SUMMARY',
    label: '요약',
    hint: '핵심만 짧게',
    example: '친구와 한강 산책, 시원한 바람과 커피.',
  },
];

export const diaryStyleLabel = (value: DiaryStyle) =>
  DIARY_STYLES.find((s) => s.value === value)?.label ?? value;

// 가입 시각(ISO) → KST 기준 "2026.10.24"와 오늘까지 며칠째인지(가입일이 1일째)
export function joinInfo(
  createdAt: string,
  today: string,
): { label: string; days: number } {
  const joined = new Date(new Date(createdAt).getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const diff =
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${joined}T00:00:00Z`)) /
    86_400_000;
  return { label: joined.replaceAll('-', '.'), days: Math.max(1, diff + 1) };
}

export function nicknameError(raw: string): string | null {
  const v = raw.trim();
  if (v.length === 0) return '닉네임을 입력해 주세요.';
  if (v.length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MAX}자까지예요.`;
  return null;
}

// 편집 중인 항목. id가 있으면 기존 항목(과거 체크 기록이 유지된다)
export type DraftItem = { key: string; id?: string; label: string };

export type CategoryDraft = {
  name: string;
  color: string;
  items: DraftItem[];
};

export type CategoryErrors = {
  name?: string;
  items?: string;
  itemKeys: string[]; // 라벨이 잘못된 항목
};

export function validateCategory(d: CategoryDraft): CategoryErrors {
  const errors: CategoryErrors = { itemKeys: [] };
  const name = d.name.trim();
  if (name.length === 0) errors.name = '이름을 입력해 주세요.';
  else if (name.length > CATEGORY_NAME_MAX)
    errors.name = `이름은 ${CATEGORY_NAME_MAX}자까지예요.`;

  const items = d.items.filter((i) => i.label.trim().length > 0);
  if (items.length === 0) errors.items = '항목을 1개 이상 넣어 주세요.';
  else if (items.length > ITEMS_MAX)
    errors.items = `항목은 ${ITEMS_MAX}개까지예요.`;
  for (const i of d.items) {
    if (i.label.trim().length > ITEM_LABEL_MAX) errors.itemKeys.push(i.key);
  }
  if (errors.itemKeys.length > 0 && !errors.items)
    errors.items = `항목 이름은 ${ITEM_LABEL_MAX}자까지예요.`;
  return errors;
}

export const isValidCategory = (e: CategoryErrors) =>
  !e.name && !e.items && e.itemKeys.length === 0;

// 빈 칸은 버리고 앞뒤 공백을 지운다
const cleanItems = (items: DraftItem[]) =>
  items
    .map((i) => ({ ...i, label: i.label.trim() }))
    .filter((i) => i.label.length > 0);

// POST /checklist/categories 본문
export function toCreateBody(d: CategoryDraft) {
  return {
    name: d.name.trim(),
    color: d.color,
    items: cleanItems(d.items).map((i) => i.label),
  };
}

// PATCH /checklist/categories/:id 본문. items는 전체 교체(빠진 항목은 과거 체크와 함께 삭제)
export function toUpdateBody(d: CategoryDraft) {
  return {
    name: d.name.trim(),
    color: d.color,
    items: cleanItems(d.items).map((i) =>
      i.id ? { id: i.id, label: i.label } : { label: i.label },
    ),
  };
}

// 저장하면 사라지는 기존 항목 (확인 문구에 쓴다)
export function removedItems(
  original: { id: string; label: string }[],
  d: CategoryDraft,
): string[] {
  const kept = new Set(
    cleanItems(d.items).flatMap((i) => (i.id ? [i.id] : [])),
  );
  return original.filter((o) => !kept.has(o.id)).map((o) => o.label);
}
