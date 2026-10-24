import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ITEMS_MAX,
  isValidCategory,
  nicknameError,
  removedItems,
  toCreateBody,
  toUpdateBody,
  validateCategory,
  type CategoryDraft,
} from './logic.ts';

const draft = (over: Partial<CategoryDraft> = {}): CategoryDraft => ({
  name: '운동',
  color: '#4CAF50',
  items: [
    { key: 'a', id: 'i1', label: '걷기' },
    { key: 'b', label: ' 수영 ' },
  ],
  ...over,
});

describe('nicknameError', () => {
  it('공백만·21자는 에러, 20자는 통과', () => {
    assert.ok(nicknameError('   '));
    assert.ok(nicknameError('가'.repeat(21)));
    assert.equal(nicknameError(` ${'가'.repeat(20)} `), null);
  });
});

describe('validateCategory', () => {
  it('정상', () => {
    assert.equal(isValidCategory(validateCategory(draft())), true);
  });

  it('이름 없음·21자', () => {
    assert.ok(validateCategory(draft({ name: ' ' })).name);
    assert.ok(validateCategory(draft({ name: 'a'.repeat(21) })).name);
  });

  it('빈 칸만 있으면 항목 없음, 11개는 초과', () => {
    assert.ok(
      validateCategory(draft({ items: [{ key: 'x', label: ' ' }] })).items,
    );
    const many = Array.from({ length: ITEMS_MAX + 1 }, (_, i) => ({
      key: String(i),
      label: `항목${i}`,
    }));
    assert.ok(validateCategory(draft({ items: many })).items);
  });

  it('21자 항목은 그 항목 key를 표시', () => {
    const e = validateCategory(
      draft({ items: [{ key: 'long', label: 'a'.repeat(21) }] }),
    );
    assert.deepEqual(e.itemKeys, ['long']);
    assert.equal(isValidCategory(e), false);
  });
});

describe('요청 본문', () => {
  it('추가: 공백 정리, 빈 칸 제외', () => {
    assert.deepEqual(
      toCreateBody(
        draft({
          items: [
            { key: 'a', label: ' 걷기 ' },
            { key: 'b', label: '' },
          ],
        }),
      ),
      { name: '운동', color: '#4CAF50', items: ['걷기'] },
    );
  });

  it('수정: 기존 항목은 id 유지, 새 항목은 label만', () => {
    assert.deepEqual(toUpdateBody(draft()).items, [
      { id: 'i1', label: '걷기' },
      { label: '수영' },
    ]);
  });

  it('저장하면 사라지는 기존 항목', () => {
    const original = [
      { id: 'i1', label: '걷기' },
      { id: 'i2', label: '헬스' },
    ];
    assert.deepEqual(removedItems(original, draft()), ['헬스']);
    // 라벨을 비운 기존 항목도 사라진다
    assert.deepEqual(
      removedItems(
        original,
        draft({ items: [{ key: 'a', id: 'i1', label: ' ' }] }),
      ),
      ['걷기', '헬스'],
    );
  });
});
