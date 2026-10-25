import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  answersPayload,
  canAnalyze,
  indexBadgeOf,
  inputFooterOf,
  remainingSlots,
  stageOf,
} from './stage.ts';

describe('stageOf', () => {
  it('서버 상태 → 화면 단계', () => {
    assert.equal(stageOf(null), 'input');
    assert.equal(stageOf({ status: 'DRAFT' }), 'input');
    assert.equal(stageOf({ status: 'QUESTIONING' }), 'questions');
    assert.equal(stageOf({ status: 'READY' }), 'ready');
    assert.equal(stageOf({ status: 'GENERATED' }), 'draft');
    assert.equal(stageOf({ status: 'CONFIRMED' }), 'confirmed');
  });
});

describe('canAnalyze', () => {
  it('사진 0장이거나 올리는 중이면 분석할 수 없다', () => {
    assert.equal(canAnalyze({ uploaded: 0, uploading: 0 }), false);
    assert.equal(canAnalyze({ uploaded: 1, uploading: 1 }), false);
    assert.equal(canAnalyze({ uploaded: 1, uploading: 0 }), true);
  });
});

describe('remainingSlots', () => {
  it('최대 3장', () => {
    assert.equal(remainingSlots(0, 3), 3);
    assert.equal(remainingSlots(3, 3), 0);
    assert.equal(remainingSlots(4, 3), 0);
  });
});

describe('indexBadgeOf', () => {
  it('확정 후 기억 저장 상태', () => {
    assert.equal(indexBadgeOf('NONE'), null);
    assert.equal(indexBadgeOf('PENDING')?.label, '기억에 저장 중…');
    assert.equal(indexBadgeOf('FAILED')?.label, '기억 저장 실패 — 자동 재시도');
    assert.equal(indexBadgeOf('INDEXED')?.tone, 'success');
  });
});

describe('answersPayload', () => {
  it('공백만 있는 답은 빼고 앞뒤 공백을 지운다', () => {
    assert.deepEqual(answersPayload({ q1: '  민지랑 ', q2: '   ' }), [
      { questionId: 'q1', answer: '민지랑' },
    ]);
  });
});

describe('inputFooterOf', () => {
  it('1단계: 사진이 있어야 [다음], 올리는 중이면 기다림', () => {
    assert.deepEqual(
      inputFooterOf(1, { uploaded: 0, uploading: 0, checked: 0 }),
      {
        primary: '다음',
        enabled: false,
        skip: false,
        hint: '사진을 1장 이상 올려 주세요.',
      },
    );
    const busy = inputFooterOf(1, { uploaded: 1, uploading: 1, checked: 0 });
    assert.equal(busy.primary, '사진을 올리는 중…');
    assert.equal(busy.enabled, false);
    assert.equal(busy.hint, null);
    assert.equal(
      inputFooterOf(1, { uploaded: 2, uploading: 0, checked: 0 }).enabled,
      true,
    );
  });

  it('2단계: 아무것도 안 고르면 [건너뛰기]도 보인다', () => {
    const none = inputFooterOf(2, { uploaded: 1, uploading: 0, checked: 0 });
    assert.equal(none.primary, 'AI로 일기 만들기');
    assert.equal(none.skip, true);
    assert.equal(
      inputFooterOf(2, { uploaded: 1, uploading: 0, checked: 3 }).skip,
      false,
    );
  });
});
