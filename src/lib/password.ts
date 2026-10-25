// 비밀번호 규칙. 서버(SignupDto·ChangePasswordDto)와 같다: 8~64자, 영문과 숫자 각각 1자 이상
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
export const PASSWORD_RULE = '8자 이상, 영문과 숫자 포함';

export type PasswordChangeInput = {
  current: string;
  next: string;
  confirm: string;
};

// 비밀번호 변경 입력 검사. 칸별 안내(입력한 칸만)와 [변경하기] 가능 여부
export function checkPasswordChange({
  current,
  next,
  confirm,
}: PasswordChangeInput) {
  const nextError =
    next.length === 0
      ? null
      : !PASSWORD_RE.test(next)
        ? `${PASSWORD_RULE}으로 써 주세요.`
        : next === current
          ? '지금과 다른 비밀번호를 입력해 주세요.'
          : null;
  const confirmError =
    confirm.length > 0 && confirm !== next
      ? '새 비밀번호와 같지 않아요.'
      : null;
  return {
    nextError,
    confirmError,
    canSubmit:
      current.length > 0 &&
      PASSWORD_RE.test(next) &&
      next !== current &&
      confirm === next,
  };
}
