import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatKoreanDate,
  isDateString,
  normalizeEntryDate,
  todayKst,
} from './dates.ts';
import { resizeTarget } from './image-size.ts';

describe('dates', () => {
  it('KST 자정 경계', () => {
    assert.equal(todayKst(Date.parse('2026-10-24T14:59:59Z')), '2026-10-24');
    assert.equal(todayKst(Date.parse('2026-10-24T15:00:00Z')), '2026-10-25');
  });

  it('잘못되거나 미래인 날짜는 오늘로', () => {
    assert.equal(normalizeEntryDate('2026-10-20', '2026-10-24'), '2026-10-20');
    assert.equal(normalizeEntryDate('2026-10-25', '2026-10-24'), '2026-10-24');
    assert.equal(normalizeEntryDate('2026-02-30', '2026-10-24'), '2026-10-24');
    assert.equal(normalizeEntryDate(undefined, '2026-10-24'), '2026-10-24');
    assert.equal(isDateString('2024-02-29'), true);
  });

  it('한국어 날짜 표기', () => {
    assert.equal(formatKoreanDate('2026-10-24'), '10월 24일 (토)');
  });
});

describe('resizeTarget', () => {
  it('긴 변이 1600을 넘을 때만 줄인다', () => {
    assert.deepEqual(resizeTarget(4032, 3024), { width: 1600 });
    assert.deepEqual(resizeTarget(3024, 4032), { height: 1600 });
    assert.equal(resizeTarget(1600, 1200), null);
    assert.equal(resizeTarget(0, 0), null);
  });
});
