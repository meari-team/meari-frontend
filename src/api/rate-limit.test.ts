import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rateLimitMessage } from './rate-limit.ts';

describe('rateLimitMessage (429)', () => {
  it('대기 시간 단위에 맞춰 안내한다', () => {
    assert.equal(
      rateLimitMessage({ retryAfter: 42 }),
      '요청이 많아요. 42초 뒤에 다시 시도해 주세요.',
    );
    assert.equal(
      rateLimitMessage({ retryAfter: 61 }),
      '요청이 많아요. 2분 뒤에 다시 시도해 주세요.',
    );
    assert.equal(
      rateLimitMessage({ retryAfter: 5 * 3600 }),
      '오늘 쓸 수 있는 횟수를 다 썼어요. 5시간 뒤에 다시 시도해 주세요.',
    );
  });

  it('대기 시간이 없으면 일반 안내', () => {
    assert.equal(
      rateLimitMessage(null),
      '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    );
  });
});
