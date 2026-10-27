import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPLASH_MS, splashDone } from './splash.ts';

test('splashDone: 1.5초가 지나면 넘어간다', () => {
  assert.equal(splashDone(0, true), false);
  assert.equal(splashDone(SPLASH_MS - 1, true), false);
  assert.equal(splashDone(SPLASH_MS, true), true);
});

test('splashDone: 토큰 확인이 끝나야 넘어간다', () => {
  assert.equal(splashDone(SPLASH_MS + 5000, false), false);
});
