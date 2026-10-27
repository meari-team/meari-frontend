import assert from 'node:assert/strict';
import { test } from 'node:test';
import { feedRows, mergePages, monthLabel, nextBeforeOf } from './feed.ts';

test('monthLabel', () => {
  assert.equal(monthLabel('2026-10-24'), '2026년 10월');
  assert.equal(monthLabel('2026-01-02'), '2026년 1월');
});

test('feedRows: 달이 바뀌는 곳마다 헤더', () => {
  const rows = feedRows([
    { date: '2026-10-24' },
    { date: '2026-10-01' },
    { date: '2026-09-30' },
    { date: '2025-12-31' },
  ]);
  assert.deepEqual(
    rows.map((r) => (r.type === 'month' ? r.label : r.item.date)),
    [
      '2026년 10월',
      '2026-10-24',
      '2026-10-01',
      '2026년 9월',
      '2026-09-30',
      '2025년 12월',
      '2025-12-31',
    ],
  );
  assert.equal(new Set(rows.map((r) => r.key)).size, rows.length); // key 중복 없음
});

test('feedRows: 빈 목록', () => {
  assert.deepEqual(feedRows([]), []);
});

test('nextBeforeOf: null이면 끝', () => {
  assert.equal(nextBeforeOf({ nextBefore: '2026-09-30' }), '2026-09-30');
  assert.equal(nextBeforeOf({ nextBefore: null }), undefined);
});

test('mergePages: 순서 유지, 겹친 날짜는 한 번만', () => {
  const merged = mergePages([
    { items: [{ date: '2026-10-24' }, { date: '2026-10-20' }] },
    { items: [{ date: '2026-10-20' }, { date: '2026-10-10' }] },
  ]);
  assert.deepEqual(
    merged.map((m) => m.date),
    ['2026-10-24', '2026-10-20', '2026-10-10'],
  );
});
