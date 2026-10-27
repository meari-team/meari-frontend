import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { appendToLatest } from '@/features/past-self/logic';
import { api } from './client';
import { unwrap } from './errors';
import type { components } from './schema';

export type AvailabilityDto = components['schemas']['AvailabilityDto'];
export type AvailabilityPresetDto =
  components['schemas']['AvailabilityPresetDto'];
export type ChatSessionDto = components['schemas']['ChatSessionDto'];
export type ChatMessageDto = components['schemas']['ChatMessageDto'];
type ChatMessagePage = components['schemas']['ChatMessagePageDto'];

// 과거의 나 응답은 수 초 걸린다. 앱은 50초까지 기다린다 (api.md §5)
const AI_TIMEOUT_MS = 50_000;
const PAGE_SIZE = 30;

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export const presetsKey = ['past-self', 'presets'] as const;
export const availabilityKey = (anchorDate: string) =>
  ['past-self', 'availability', anchorDate] as const;
export const sessionsKey = ['chat', 'sessions'] as const;
export const messagesKey = (sessionId: string) =>
  ['chat', 'messages', sessionId] as const;

// 프리셋(1W~1Y)별 기록 수. anchorDate 없이 부르면 목록 형태로 온다
export function usePresets() {
  return useQuery({
    queryKey: presetsKey,
    queryFn: async () => {
      const res = await unwrap(api.GET('/api/v1/past-self/availability'));
      return 'items' in res ? res.items : [];
    },
  });
}

export function useAvailability(anchorDate: string) {
  return useQuery({
    queryKey: availabilityKey(anchorDate),
    queryFn: async (): Promise<AvailabilityDto> => {
      const res = await unwrap(
        api.GET('/api/v1/past-self/availability', {
          params: { query: { anchorDate } },
        }),
      );
      if ('items' in res) throw new Error('예상과 다른 응답이에요.');
      return res;
    },
  });
}

export function useChatSessions() {
  return useQuery({
    queryKey: sessionsKey,
    queryFn: async () => (await unwrap(api.GET('/api/v1/chat/sessions'))).items,
  });
}

export function useCreateSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (anchorDate: string) =>
      unwrap(api.POST('/api/v1/chat/sessions', { body: { anchorDate } })),
    onSuccess: () => client.invalidateQueries({ queryKey: sessionsKey }),
  });
}

// 첫 페이지 = 가장 최근 메시지. fetchNextPage = 그 이전 메시지
export function useChatMessages(sessionId: string) {
  return useInfiniteQuery({
    queryKey: messagesKey(sessionId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET('/api/v1/chat/sessions/{id}/messages', {
          params: {
            path: { id: sessionId },
            query: { limit: PAGE_SIZE, cursor: pageParam },
          },
        }),
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

// 보내기. 성공하면 받은 두 메시지(내 질문·과거의 나 답)를 목록 끝에 붙인다.
// 실패하면 서버에 아무것도 저장되지 않으므로 같은 내용으로 다시 보내면 된다
export function useSendMessage(sessionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      unwrap(
        api.POST('/api/v1/chat/sessions/{id}/messages', {
          params: { path: { id: sessionId } },
          body: { content },
          signal: timeoutSignal(AI_TIMEOUT_MS),
        }),
      ),
    onSuccess: (res) => {
      client.setQueryData<InfiniteData<ChatMessagePage, string | undefined>>(
        messagesKey(sessionId),
        (data) =>
          data && {
            ...data,
            pages: appendToLatest(data.pages, [
              res.userMessage,
              res.assistantMessage,
            ]),
          },
      );
      void client.invalidateQueries({ queryKey: sessionsKey });
    },
  });
}
