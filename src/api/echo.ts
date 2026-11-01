import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { entryKey, invalidateEntry } from './entries';
import { unwrap } from './errors';
import { sessionsKey } from './past-self';
import type { components } from './schema';

export type EchoSettingsDto = components['schemas']['EchoSettingsDto'];
export type UpdateEchoSettings = components['schemas']['UpdateEchoSettingsDto'];
export type EchoSummaryDto = components['schemas']['EchoSummaryDto'];
export type EchoDto = components['schemas']['EchoDto'];

export const echoSettingsKey = ['echo', 'settings'] as const;
export const echoesKey = ['echo', 'list'] as const;
export const echoKey = (id: string) => ['echo', 'detail', id] as const;

// 기억하고 싶은 날 (확정 일기만). 메아리 후보 수가 바뀌므로 설정도 다시 읽는다
export function useBookmark(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      unwrap(
        api.PUT('/api/v1/entries/{date}/bookmark', {
          params: { path: { date } },
          body: { bookmarked },
        }),
      ),
    onSuccess: (entry) => {
      client.setQueryData(entryKey(date), entry);
      void invalidateEntry(client, date);
      void client.invalidateQueries({ queryKey: echoSettingsKey });
    },
  });
}

export function useEchoSettings() {
  return useQuery({
    queryKey: echoSettingsKey,
    queryFn: () => unwrap(api.GET('/api/v1/me/echo-settings')),
  });
}

export function useUpdateEchoSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateEchoSettings) =>
      unwrap(api.PUT('/api/v1/me/echo-settings', { body })),
    onSuccess: (settings) => client.setQueryData(echoSettingsKey, settings),
  });
}

// 도착한 메아리. 앱이 켜져 있는 동안 가끔 다시 본다 (푸시가 막혀 있어도 앱 안에서 확인)
export function useEchoes() {
  return useQuery({
    queryKey: echoesKey,
    queryFn: () => unwrap(api.GET('/api/v1/echoes')),
    refetchInterval: 60_000,
  });
}

export function useEcho(id: string | undefined) {
  return useQuery({
    queryKey: echoKey(id ?? ''),
    enabled: !!id,
    queryFn: () =>
      unwrap(api.GET('/api/v1/echoes/{id}', { params: { path: { id: id! } } })),
  });
}

export function useMarkEchoRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        api.POST('/api/v1/echoes/{id}/read', { params: { path: { id } } }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: echoesKey }),
  });
}

// 시연: 지금 한 회차 받기 (서버 ECHO_DEMO=true일 때만)
export function useDemoEcho() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST('/api/v1/echoes/demo')),
    onSuccess: (echo) => {
      client.setQueryData(echoKey(echo.id), echo);
      void client.invalidateQueries({ queryKey: echoesKey });
      void client.invalidateQueries({ queryKey: sessionsKey });
    },
  });
}

export function registerPushToken(token: string, platform: 'ios' | 'android') {
  return unwrap(
    api.POST('/api/v1/me/push-tokens', { body: { token, platform } }),
  );
}

export function removePushToken(token: string) {
  return unwrap(api.DELETE('/api/v1/me/push-tokens', { body: { token } }));
}
