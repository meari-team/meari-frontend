import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import { meQueryKey } from './auth';
import { api } from './client';
import { unwrap } from './errors';
import type { components } from './schema';

type UpdateMeBody = components['schemas']['UpdateMeDto'];

// U2: 보낸 필드만 바꾼다
export function useUpdateMe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) =>
      unwrap(api.PATCH('/api/v1/me', { body })),
    onSuccess: (me) => client.setQueryData(meQueryKey, me),
  });
}

// U3: 회원 탈퇴. AI 기억을 먼저 지우고, 하나라도 실패하면 503이고 아무것도 지워지지 않는다.
// 성공하면 토큰을 지운다 → 로그인 화면으로 (캐시는 루트 레이아웃이 비운다)
export function useWithdraw() {
  const signOut = useAuth((s) => s.signOut);
  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/api/v1/me')),
    onSuccess: () => signOut(),
  });
}
