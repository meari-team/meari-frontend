import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countByDate, normalizeTime, validateTitle } from './schedule.ts';

test('normalizeTime: 여러 입력을 HH:mm으로', () => {
  assert.equal(normalizeTime(''), null);
  assert.equal(normalizeTime('  '), null);
  assert.equal(normalizeTime('9:5'), '09:05');
  assert.equal(normalizeTime('09:30'), '09:30');
  assert.equal(normalizeTime('0930'), '09:30');
  assert.equal(normalizeTime('930'), '09:30');
  assert.equal(normalizeTime('14시'), '14:00');
  assert.equal(normalizeTime('9시 30분'), '09:30');
  assert.equal(normalizeTime('23:59'), '23:59');
});

test('normalizeTime: 틀린 시간은 undefined', () => {
  assert.equal(normalizeTime('24:00'), undefined);
  assert.equal(normalizeTime('12:60'), undefined);
  assert.equal(normalizeTime('오후 3시'), undefined);
  assert.equal(normalizeTime('abc'), undefined);
});

test('validateTitle', () => {
  assert.equal(validateTitle('  '), '일정 이름을 적어 주세요.');
  assert.equal(
    validateTitle('a'.repeat(51)),
    '일정 이름은 50자까지 쓸 수 있어요.',
  );
  assert.equal(validateTitle('  동아리 회의 '), null);
});

test('countByDate', () => {
  const m = countByDate([
    { date: '2026-10-01' },
    { date: '2026-10-01' },
    { date: '2026-10-03' },
  ]);
  assert.equal(m.get('2026-10-01'), 2);
  assert.equal(m.get('2026-10-03'), 1);
  assert.equal(m.get('2026-10-02'), undefined);
});
