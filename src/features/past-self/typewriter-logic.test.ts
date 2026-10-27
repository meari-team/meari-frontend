import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { charsPerTick, shouldType, splitChars } from './typewriter-logic.ts';

describe('타자 효과', () => {
  it('짧은 답은 한 글자씩, 긴 답은 여러 글자씩', () => {
    assert.equal(charsPerTick(0), 1);
    assert.equal(charsPerTick(80), 1);
    assert.equal(charsPerTick(120), 1);
    assert.equal(charsPerTick(121), 2);
    assert.equal(charsPerTick(600), 5);
  });

  it('한글·이모지를 한 글자로 센다', () => {
    assert.deepEqual(splitChars('안녕🙂'), ['안', '녕', '🙂']);
  });

  it('보낸 뒤 새로 온 맨 끝 AI 답장만 타자로', () => {
    const before = new Set(['a1', 'u1']);
    const reply = { id: 'a2', role: 'ASSISTANT' };
    assert.equal(shouldType(reply, true, before), true);
    // 들어왔을 때 이미 있던 대화는 바로 전체
    assert.equal(shouldType(reply, true, null), false);
    assert.equal(
      shouldType({ id: 'a1', role: 'ASSISTANT' }, true, before),
      false,
    );
    // 이전 메시지 불러오기로 앞에 붙은 것
    assert.equal(
      shouldType({ id: 'a0', role: 'ASSISTANT' }, false, before),
      false,
    );
    assert.equal(shouldType({ id: 'u2', role: 'USER' }, true, before), false);
  });
});
