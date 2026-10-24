import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canGoNextMonth,
  dayStateOf,
  daysInMonth,
  groupByMonth,
  monthGrid,
  monthRange,
  shiftMonth,
  yearRange,
} from './calendar.ts';

describe('calendar', () => {
  it('월 일수 (윤년 포함)', () => {
    assert.equal(daysInMonth({ year: 2026, month: 2 }), 28);
    assert.equal(daysInMonth({ year: 2024, month: 2 }), 29);
    assert.equal(daysInMonth({ year: 2026, month: 10 }), 31);
  });

  it('월 이동은 연도를 넘긴다', () => {
    assert.deepEqual(shiftMonth({ year: 2026, month: 1 }, -1), {
      year: 2025,
      month: 12,
    });
    assert.deepEqual(shiftMonth({ year: 2026, month: 12 }, 1), {
      year: 2027,
      month: 1,
    });
    assert.deepEqual(shiftMonth({ year: 2026, month: 10 }, -12), {
      year: 2025,
      month: 10,
    });
  });

  it('API 범위', () => {
    assert.deepEqual(monthRange({ year: 2026, month: 2 }), {
      from: '2026-02-01',
      to: '2026-02-28',
    });
    assert.deepEqual(yearRange(2026), { from: '2026-01-01', to: '2026-12-31' });
  });

  it('월 격자: 일요일 시작, 7칸씩, 앞뒤 빈칸', () => {
    const grid = monthGrid({ year: 2026, month: 10 }); // 2026-10-01은 목요일
    assert.equal(grid[0].length, 7);
    assert.deepEqual(grid[0].slice(0, 5), [
      null,
      null,
      null,
      null,
      '2026-10-01',
    ]);
    assert.equal(grid.flat().filter(Boolean).length, 31);
    assert.equal(grid.flat().length % 7, 0);
  });

  it('다음 달은 오늘 기준 12개월 뒤까지 넘긴다', () => {
    assert.equal(canGoNextMonth({ year: 2026, month: 9 }, '2026-10-24'), true);
    // 일정을 미리 넣을 수 있게 12개월 뒤까지
    assert.equal(canGoNextMonth({ year: 2027, month: 9 }, '2026-10-24'), true);
    assert.equal(
      canGoNextMonth({ year: 2027, month: 10 }, '2026-10-24'),
      false,
    );
    assert.equal(
      canGoNextMonth({ year: 2026, month: 10 }, '2026-10-24', 0),
      false,
    );
  });

  it('칸 상태', () => {
    assert.equal(dayStateOf('2026-10-25', '2026-10-24', undefined), 'future');
    assert.equal(dayStateOf('2026-10-23', '2026-10-24', undefined), 'empty');
    assert.equal(
      dayStateOf('2026-10-23', '2026-10-24', 'GENERATED'),
      'writing',
    );
    assert.equal(
      dayStateOf('2026-10-23', '2026-10-24', 'CONFIRMED'),
      'confirmed',
    );
  });

  it('연간 보관함: 최신 달이 위, 달 안은 날짜순', () => {
    const groups = groupByMonth([
      { date: '2026-09-02' },
      { date: '2026-10-05' },
      { date: '2026-09-01' },
    ]);
    assert.deepEqual(
      groups.map((g) => g.month),
      [10, 9],
    );
    assert.deepEqual(
      groups[1].items.map((i) => i.date),
      ['2026-09-01', '2026-09-02'],
    );
  });
});
