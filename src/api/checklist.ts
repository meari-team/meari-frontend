import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from './client';
import { checklistKey, entriesKey } from './entries';
import { unwrap } from './errors';
import type { components } from './schema';

type CreateBody = components['schemas']['CreateCategoryDto'];
type UpdateBody = components['schemas']['UpdateCategoryDto'];

// 체크리스트가 바뀌면 오늘의 일기(체크 칩), 캘린더(카테고리 색), 일기 상세(체크 항목)가 달라진다
function invalidateChecklist(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: checklistKey }),
    client.invalidateQueries({ queryKey: entriesKey }),
    client.invalidateQueries({ queryKey: ['entry'] }),
  ]);
}

export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBody) =>
      unwrap(api.POST('/api/v1/checklist/categories', { body })),
    onSuccess: () => invalidateChecklist(client),
  });
}

// items를 보내면 전체 교체. id가 있는 항목은 유지(과거 체크 기록 포함)
export function useUpdateCategory(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBody) =>
      unwrap(
        api.PATCH('/api/v1/checklist/categories/{id}', {
          params: { path: { id } },
          body,
        }),
      ),
    onSuccess: () => invalidateChecklist(client),
  });
}

// 항목과 과거 체크 기록까지 함께 지워진다
export function useDeleteCategory(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/api/v1/checklist/categories/{id}', {
          params: { path: { id } },
        }),
      ),
    onSuccess: () => invalidateChecklist(client),
  });
}
