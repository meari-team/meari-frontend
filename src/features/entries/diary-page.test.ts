import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkedLabels, longKoreanDate, memoryLineOf } from './diary-page.ts';

describe('일기 한 쪽', () => {
  it('날짜 줄', () => {
    assert.equal(longKoreanDate('2026-10-20'), '2026년 10월 20일 화요일');
    assert.equal(longKoreanDate('2026-06-19'), '2026년 6월 19일 금요일');
  });

  it('기억 상태 한 줄', () => {
    assert.deepEqual(memoryLineOf('INDEXED', false), {
      label: '기억에 저장됨',
      busy: false,
      failed: false,
    });
    assert.equal(memoryLineOf('PENDING', false)?.busy, true);
    assert.equal(memoryLineOf('FAILED', false)?.failed, true);
    // 제외가 상태보다 먼저
    assert.equal(memoryLineOf('NONE', true)?.label, '기억에서 제외됨');
    assert.equal(memoryLineOf('NONE', false), null);
  });

  it('체크한 항목 이름 (카테고리 순서)', () => {
    const categories = [
      {
        items: [
          { id: 'a', label: '러닝' },
          { id: 'b', label: '헬스' },
        ],
      },
      { items: [{ id: 'c', label: '카페' }] },
    ];
    assert.deepEqual(checkedLabels(categories, ['c', 'a']), ['러닝', '카페']);
    assert.deepEqual(checkedLabels(categories, []), []);
  });
});
