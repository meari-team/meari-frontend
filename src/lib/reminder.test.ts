import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reminderTimes } from './reminder.ts';

const iso = (times: number[]) => times.map((t) => new Date(t).toISOString());

describe('reminderTimes', () => {
  it('아직 안 썼고 9시 전이면 오늘 9시부터', () => {
    // KST 2026-11-01 18:00
    const times = reminderTimes(Date.parse('2026-11-01T09:00:00Z'), false, 3);
    assert.deepEqual(iso(times), [
      '2026-11-01T12:00:00.000Z',
      '2026-11-02T12:00:00.000Z',
      '2026-11-03T12:00:00.000Z',
    ]);
  });

  it('오늘 일기를 썼으면 내일부터', () => {
    const times = reminderTimes(Date.parse('2026-11-01T09:00:00Z'), true, 2);
    assert.deepEqual(iso(times), [
      '2026-11-02T12:00:00.000Z',
      '2026-11-03T12:00:00.000Z',
    ]);
  });

  it('9시가 지났으면 내일부터', () => {
    // KST 2026-11-01 21:00 정각
    const times = reminderTimes(Date.parse('2026-11-01T12:00:00Z'), false, 1);
    assert.deepEqual(iso(times), ['2026-11-02T12:00:00.000Z']);
  });

  it('KST 자정 직후는 그날 9시', () => {
    // KST 2026-11-02 00:30
    const times = reminderTimes(Date.parse('2026-11-01T15:30:00Z'), false, 1);
    assert.deepEqual(iso(times), ['2026-11-02T12:00:00.000Z']);
  });
});
