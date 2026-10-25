import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPasswordChange, PASSWORD_RE } from './password.ts';

test('비밀번호 규칙: 8~64자, 영문·숫자 각 1자 이상', () => {
  assert.equal(PASSWORD_RE.test('abcd1234'), true);
  assert.equal(PASSWORD_RE.test('abcdefgh'), false);
  assert.equal(PASSWORD_RE.test('12345678'), false);
  assert.equal(PASSWORD_RE.test('ab12'), false);
});

test('비밀번호 변경: 빈 칸은 안내 없이 비활성', () => {
  assert.deepEqual(
    checkPasswordChange({ current: '', next: '', confirm: '' }),
    {
      nextError: null,
      confirmError: null,
      canSubmit: false,
    },
  );
});

test('비밀번호 변경: 규칙·같은 비밀번호·확인 불일치', () => {
  const weak = checkPasswordChange({
    current: 'test',
    next: 'short',
    confirm: 'short',
  });
  assert.match(weak.nextError ?? '', /8자 이상/);
  assert.equal(weak.canSubmit, false);

  const same = checkPasswordChange({
    current: 'abcd1234',
    next: 'abcd1234',
    confirm: 'abcd1234',
  });
  assert.equal(same.nextError, '지금과 다른 비밀번호를 입력해 주세요.');
  assert.equal(same.canSubmit, false);

  const mismatch = checkPasswordChange({
    current: 'test',
    next: 'newpass99',
    confirm: 'newpass9',
  });
  assert.equal(mismatch.confirmError, '새 비밀번호와 같지 않아요.');
  assert.equal(mismatch.canSubmit, false);
});

test('비밀번호 변경: 지금 비밀번호는 규칙 검사 안 함 (시연 계정 test)', () => {
  assert.deepEqual(
    checkPasswordChange({
      current: 'test',
      next: 'newpass99',
      confirm: 'newpass99',
    }),
    { nextError: null, confirmError: null, canSubmit: true },
  );
});
