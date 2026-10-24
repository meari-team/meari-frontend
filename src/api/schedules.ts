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
