import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import { api } from './client';
import { unwrap } from './errors';
import type { components } from './schema';

type LoginBody = components['schemas']['LoginDto'];
type SignupBody = components['schemas']['SignupDto'];

export const meQueryKey = ['me'] as const;

export function useLogin() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({
    mutationFn: (body: LoginBody) =>
      unwrap(api.POST('/api/v1/auth/login', { body })),
    onSuccess: (res) => signIn(res.accessToken),
  });
}

export function useSignup() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({
    mutationFn: (body: SignupBody) =>
      unwrap(api.POST('/api/v1/auth/signup', { body })),
    onSuccess: (res) => signIn(res.accessToken),
  });
}

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => unwrap(api.GET('/api/v1/me')),
  });
}
