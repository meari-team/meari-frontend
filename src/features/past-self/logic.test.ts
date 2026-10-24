import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendToLatest,
  availabilityHint,
  flattenPages,
  pastSelfTitle,
  validateAnchor,
} from './logic.ts';

describe('past-self logic', () => {
  it('대화 제목', () => {
    assert.equal(pastSelfTitle('2026-09-04'), '9월 4일의 나');
  });

  it('7일 미만 안내', () => {
    assert.equal(availabilityHint(7, 7), null);
    assert.equal(
      availabilityHint(3, 7),
      '기록이 7일 이상 쌓이면 대화할 수 있어요 (3/7)',
    );
  });

  it('직접 고른 날짜 검증', () => {
    assert.deepEqual(validateAnchor(' 2026-09-24 ', '2026-10-24'), {
      ok: true,
      date: '2026-09-24',
    });
    assert.equal(validateAnchor('2026-10-25', '2026-10-24').ok, false);
    assert.equal(validateAnchor('2026/09/24', '2026-10-24').ok, false);
    assert.equal(validateAnchor('2026-02-30', '2026-10-24').ok, false);
  });

  it('페이지를 오래된 순으로 펼친다', () => {
    const latest = { items: [{ id: 'c' }, { id: 'd' }], nextCursor: 'c' };
    const older = { items: [{ id: 'a' }, { id: 'b' }], nextCursor: null };
    assert.deepEqual(
      flattenPages([latest, older]).map((m) => m.id),
      ['a', 'b', 'c', 'd'],
    );
  });

  it('보낸 메시지는 최근 페이지 끝에, 중복 없이', () => {
    const pages = [{ items: [{ id: 'a' }], nextCursor: null }];
    const next = appendToLatest(pages, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    assert.deepEqual(
      next[0].items.map((m) => m.id),
      ['a', 'b', 'c'],
    );
    assert.deepEqual(
      appendToLatest([], [{ id: 'x' }])[0].items.map((m) => m.id),
      ['x'],
    );
  });
});
