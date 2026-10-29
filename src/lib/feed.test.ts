import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  inMonth,
  monthFeedQuery,
  monthKeyOf,
  monthTitle,
  shiftMonthKey,
} from './feed.ts';

test('monthTitle', () => {
  assert.equal(monthTitle({ year: 2026, month: 10 }), '2026년 10월');
});

test('monthFeedQuery: 다음 달 1일 미만, 31편', () => {
  assert.deepEqual(monthFeedQuery({ year: 2026, month: 10 }), {
    before: '2026-11-01',
    limit: 31,
  });
  assert.deepEqual(
    monthFeedQuery({ year: 2026, month: 12 }).before,
    '2027-01-01',
  );
});

test('inMonth: 그 달 것만', () => {
  const items = [
    { date: '2026-10-28' },
    { date: '2026-10-01' },
    { date: '2026-09-30' },
  ];
  assert.deepEqual(
    inMonth(items, { year: 2026, month: 10 }).map((i) => i.date),
    ['2026-10-28', '2026-10-01'],
  );
});

test('shiftMonthKey: 해를 넘기고, 이번 달 뒤로는 못 감', () => {
  const latest = { year: 2026, month: 10 };
  assert.deepEqual(shiftMonthKey({ year: 2026, month: 1 }, -1, latest), {
    year: 2025,
    month: 12,
  });
  assert.deepEqual(shiftMonthKey({ year: 2026, month: 10 }, 1, latest), latest);
  assert.deepEqual(monthKeyOf('2026-10-29'), { year: 2026, month: 10 });
});
