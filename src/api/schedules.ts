import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from './client';
import { unwrap } from './errors';
import type { components } from './schema';

export type ScheduleDto = components['schemas']['ScheduleDto'];
type CreateBody = components['schemas']['CreateScheduleDto'];
type UpdateBody = components['schemas']['UpdateScheduleDto'];

export const schedulesKey = ['schedules'] as const; // 기간별 하위 키 ['schedules', from, to]

// 일정이 바뀌면 캘린더(월간)·날짜 패널·오늘의 일기·일기 상세가 모두 다시 읽는다
function invalidateSchedules(client: QueryClient) {
  return client.invalidateQueries({ queryKey: schedulesKey });
}

// 기간 일정 (date → time(없는 것 먼저) → 만든 순으로 서버가 정렬)
export function useSchedules(from: string, to: string) {
  return useQuery({
    queryKey: [...schedulesKey, from, to],
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/v1/schedules', { params: { query: { from, to } } }),
        )
      ).items,
  });
}

export const useDaySchedules = (date: string) => useSchedules(date, date);

export function useCreateSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBody) =>
      unwrap(api.POST('/api/v1/schedules', { body })),
    onSuccess: () => invalidateSchedules(client),
  });
}

export function useUpdateSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateBody & { id: string }) =>
      unwrap(
        api.PATCH('/api/v1/schedules/{id}', {
          params: { path: { id } },
          body,
        }),
      ),
    onSuccess: () => invalidateSchedules(client),
  });
}

export function useDeleteSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        api.DELETE('/api/v1/schedules/{id}', { params: { path: { id } } }),
      ),
    onSuccess: () => invalidateSchedules(client),
  });
}

// 완료 체크 토글. 누르는 즉시 화면에 반영하고(낙관적), 실패하면 되돌린다
export function useToggleSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      unwrap(
        api.PATCH('/api/v1/schedules/{id}', {
          params: { path: { id } },
          body: { completed },
        }),
      ),
    onMutate: async ({ id, completed }) => {
      await client.cancelQueries({ queryKey: schedulesKey });
      const previous = client.getQueriesData<ScheduleDto[]>({
        queryKey: schedulesKey,
      });
      client.setQueriesData<ScheduleDto[]>({ queryKey: schedulesKey }, (old) =>
        old?.map((s) => (s.id === id ? { ...s, completed } : s)),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      for (const [key, data] of context?.previous ?? [])
        client.setQueryData(key, data);
    },
    onSettled: () => invalidateSchedules(client),
  });
}
