import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canGoNextMonth,
  dayStateOf,
  daysInMonth,
  diaryActionOf,
  groupByMonth,
  dayTitleOf,
  monthGrid,
  monthGridFilled,
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

  it('앞뒤 달까지 채운 격자: 2026년 10월은 9/27 시작, 10/31 끝 (5주)', () => {
    const weeks = monthGridFilled({ year: 2026, month: 10 });
    assert.equal(weeks.length, 5);
    assert.deepEqual(weeks[0][0], { date: '2026-09-27', inMonth: false });
    assert.deepEqual(weeks[0][4], { date: '2026-10-01', inMonth: true });
    assert.deepEqual(weeks[4][6], { date: '2026-10-31', inMonth: true });
    assert.ok(weeks.every((w) => w.length === 7));
  });

  it('앞뒤 달까지 채운 격자: 연말을 넘어가는 다음 달 날짜', () => {
    const weeks = monthGridFilled({ year: 2026, month: 12 });
    const last = weeks[weeks.length - 1];
    assert.deepEqual(last[6], { date: '2027-01-02', inMonth: false });
  });

  it('날짜 패널 제목', () => {
    assert.equal(dayTitleOf('2026-10-20'), '20. 화');
    assert.equal(dayTitleOf('2026-10-04'), '4. 일');
  });

  it('+ 메뉴 일기 버튼: 상태별 문구·이동, 미래는 막기', () => {
    const today = '2026-10-25';
    assert.deepEqual(diaryActionOf('2026-10-20', today), {
      kind: 'write',
      label: '이날 일기 쓰기',
      href: '/today?date=2026-10-20',
    });
    assert.equal(
      diaryActionOf('2026-10-20', today, 'GENERATED').kind,
      'continue',
    );
    assert.deepEqual(diaryActionOf('2026-10-20', today, 'CONFIRMED'), {
      kind: 'open',
      label: '이날 일기 보기',
      href: '/entry/2026-10-20',
    });
    assert.equal(diaryActionOf(today, today).label, '오늘 일기 쓰기');
    assert.equal(
      diaryActionOf('2026-10-20', today, 'QUESTIONING').label,
      '이날 일기 이어 쓰기',
    );
    assert.equal(diaryActionOf('2026-10-26', today).kind, 'future');
  });
});
