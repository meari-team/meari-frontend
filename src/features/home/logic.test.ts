import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  entryPreviewText,
  memoryDates,
  monthStartOf,
  pastSelfProgress,
  recordStats,
  shiftDate,
  todayActionOf,
} from './logic.ts';

describe('shiftDate', () => {
  it('일 단위는 달·해를 넘긴다', () => {
    assert.equal(shiftDate('2026-03-01', { days: -1 }), '2026-02-28');
    assert.equal(shiftDate('2026-01-01', { days: -1 }), '2025-12-31');
  });

  it('달·해 단위는 없는 날이면 말일로', () => {
    assert.equal(shiftDate('2026-03-31', { months: -1 }), '2026-02-28');
    assert.equal(shiftDate('2026-01-15', { months: -1 }), '2025-12-15');
    assert.equal(shiftDate('2028-02-29', { years: -1 }), '2027-02-28');
  });
});

describe('memoryDates', () => {
  it('한 달 전·1년 전 오늘', () => {
    assert.deepEqual(
      memoryDates('2026-10-24').map((m) => m.date),
      ['2026-09-24', '2025-10-24'],
    );
  });
});

describe('todayActionOf', () => {
  it('일기 상태별 버튼', () => {
    assert.equal(todayActionOf(null), 'write');
    assert.equal(todayActionOf('DRAFT'), 'continue');
    assert.equal(todayActionOf('GENERATED'), 'continue');
    assert.equal(todayActionOf('CONFIRMED'), 'view');
  });
});

describe('entryPreviewText', () => {
  it('확정본 → 초안 → 한 줄 설명, 공백 정리', () => {
    assert.equal(
      entryPreviewText({
        finalContent: ' 가\n나 ',
        aiDraft: '초안',
        note: '메모',
      }),
      '가 나',
    );
    assert.equal(
      entryPreviewText({ finalContent: '  ', aiDraft: null, note: '메모' }),
      '메모',
    );
    assert.equal(
      entryPreviewText({ finalContent: null, aiDraft: null, note: null }),
      null,
    );
  });
});

describe('recordStats', () => {
  const c = (date: string) => ({ date, status: 'CONFIRMED' as const });

  it('이번 달 확정한 날과 연속 기록', () => {
    const items = [
      c('2026-09-29'),
      c('2026-09-30'),
      c('2026-10-01'),
      c('2026-10-02'),
      { date: '2026-10-03', status: 'DRAFT' as const },
      c('2026-10-05'),
    ];
    assert.deepEqual(recordStats(items, '2026-10-02'), {
      monthCount: 2,
      streak: 4,
    });
    // 오늘을 아직 안 썼으면 어제부터
    assert.deepEqual(recordStats(items, '2026-10-03'), {
      monthCount: 2,
      streak: 4,
    });
    assert.equal(recordStats(items, '2026-10-04').streak, 0);
  });

  it('달 첫날', () => {
    assert.equal(monthStartOf('2026-10-24'), '2026-10-01');
  });
});

describe('pastSelfProgress', () => {
  it('하나라도 되면 사용 가능, 기록 수는 최댓값', () => {
    assert.deepEqual(
      pastSelfProgress([
        { available: false, recordCount: 3 },
        { available: false, recordCount: 1 },
      ]),
      { available: false, recordCount: 3 },
    );
    assert.equal(pastSelfProgress([]).recordCount, 0);
  });
});
