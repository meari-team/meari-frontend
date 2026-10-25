import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPLASH_AUTO_MS, SPLASH_MIN_MS, splashState } from './splash.ts';

const ready = { authReady: true, skipped: false };

test('splashState: 3초가 지나면 저절로 넘어간다', () => {
  assert.equal(splashState(0, ready).done, false);
  assert.equal(splashState(SPLASH_AUTO_MS - 1, ready).done, false);
  assert.equal(splashState(SPLASH_AUTO_MS, ready).done, true);
});

test('splashState: 1.5초 전에는 건너뛸 수 없다', () => {
  assert.equal(splashState(SPLASH_MIN_MS - 1, ready).canSkip, false);
  assert.equal(splashState(SPLASH_MIN_MS, ready).canSkip, true);
  assert.equal(
    splashState(SPLASH_MIN_MS, { authReady: true, skipped: true }).done,
    true,
  );
});

test('splashState: 토큰 확인이 끝나야 넘어간다', () => {
  const loading = { authReady: false, skipped: true };
  assert.equal(splashState(SPLASH_AUTO_MS + 5000, loading).done, false);
});

test('splashState: 남은 초는 3 → 2 → 1, 0은 보이지 않는다', () => {
  assert.equal(splashState(0, ready).remaining, 3);
  assert.equal(splashState(1001, ready).remaining, 2);
  assert.equal(splashState(2500, ready).remaining, 1);
  assert.equal(splashState(9999, ready).remaining, 1);
});
