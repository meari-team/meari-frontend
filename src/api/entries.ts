import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { Platform } from 'react-native';
import { api, postForm } from './client';
import { ApiError, unwrap } from './errors';
import type { components } from './schema';

export type EntryDto = components['schemas']['EntryDto'];
export type EntryStatus = EntryDto['status'];
export type PhotoDto = components['schemas']['PhotoDto'];
export type QuestionDto = components['schemas']['QuestionDto'];
export type ChecklistCategoryDto =
  components['schemas']['ChecklistCategoryDto'];
export type AnswerInput = components['schemas']['AnswerInputDto'];

// AI 호출은 수 초~수십 초 걸린다. 앱은 50초까지 기다린다 (api.md §5)
const AI_TIMEOUT_MS = 50_000;

// RN에는 AbortSignal.timeout이 없을 수 있어 직접 만든다
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export const entryKey = (date: string) => ['entry', date] as const;
export const entriesKey = ['entries'] as const; // 캘린더 목록 (기간별 하위 키)
export const checklistKey = ['checklist'] as const;

// 일기가 바뀌면 상세와 캘린더 목록을 함께 갱신한다
export function invalidateEntry(client: QueryClient, date: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: entryKey(date) }),
    client.invalidateQueries({ queryKey: entriesKey }),
  ]);
}

export function useChecklist() {
  return useQuery({
    queryKey: checklistKey,
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/checklist/categories'))).items,
    staleTime: 5 * 60_000,
  });
}

// 아직 작성 안 한 날짜는 404 → null (빈 상태)
export function useEntry(date: string, opts?: { pollWhilePending?: boolean }) {
  return useQuery({
    queryKey: entryKey(date),
    queryFn: async (): Promise<EntryDto | null> => {
      try {
        return await unwrap(
          api.GET('/api/v1/entries/{date}', { params: { path: { date } } }),
        );
      } catch (e) {
        if (e instanceof ApiError && e.code === 'ENTRY_NOT_FOUND') return null;
        throw e;
      }
    },
    // 확정 직후 기억 저장(PENDING)이 끝날 때까지 2초마다 다시 본다
    refetchInterval: (query) =>
      opts?.pollWhilePending && query.state.data?.aiIndexStatus === 'PENDING'
        ? 2000
        : false,
  });
}

export function useSaveEntryInput(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { note?: string | null; checkedItemIds?: string[] }) =>
      unwrap(
        api.PUT('/api/v1/entries/{date}', {
          params: { path: { date } },
          body,
        }),
      ),
    onSuccess: (entry) => {
      client.setQueryData(entryKey(date), entry);
      void client.invalidateQueries({ queryKey: entriesKey });
    },
  });
}

export type LocalImage = { uri: string; caption?: string | null };

// 사진은 한 장씩 올린다 → 실패한 사진만 다시 시도할 수 있다
export function useUploadPhoto(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (image: LocalImage) => {
      const form = new FormData();
      if (Platform.OS === 'web') {
        // 브라우저는 실제 Blob이 필요하다 (uri는 blob:/data: 주소)
        const blob = await (await fetch(image.uri)).blob();
        form.append('files', blob, 'photo.jpg');
      } else {
        // RN의 FormData는 { uri, name, type } 객체로 파일을 받는다
        form.append('files', {
          uri: image.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
      }
      if (image.caption)
        form.append('captions', JSON.stringify([image.caption]));
      return unwrap(
        postForm<components['schemas']['PhotoListDto']>(
          `/api/v1/entries/${date}/photos`,
          form,
        ),
      );
    },
    onSuccess: () => invalidateEntry(client, date),
  });
}

export function useUpdatePhoto(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      photoId: string;
      caption?: string;
      sortOrder?: number;
    }) =>
      unwrap(
        api.PATCH('/api/v1/entries/{date}/photos/{photoId}', {
          params: { path: { date, photoId: v.photoId } },
          body: { caption: v.caption, sortOrder: v.sortOrder },
        }),
      ),
    onSuccess: () => invalidateEntry(client, date),
  });
}

export function useDeletePhoto(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      unwrap(
        api.DELETE('/api/v1/entries/{date}/photos/{photoId}', {
          params: { path: { date, photoId } },
        }),
      ),
    onSuccess: () => invalidateEntry(client, date),
  });
}

export function useAnalyze(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/api/v1/entries/{date}/analyze', {
          params: { path: { date } },
          signal: timeoutSignal(AI_TIMEOUT_MS),
        }),
      ),
    onSuccess: () => invalidateEntry(client, date),
  });
}

// refresh: false — 답변 직후 바로 생성할 때, 중간 상태(READY)로 화면이 바뀌지 않게 한다
export function useAnswer(date: string, opts: { refresh?: boolean } = {}) {
  const client = useQueryClient();
  const refresh = opts.refresh ?? true;
  return useMutation({
    mutationFn: (answers: AnswerInput[]) =>
      unwrap(
        api.PUT('/api/v1/entries/{date}/answers', {
          params: { path: { date } },
          body: { answers },
        }),
      ),
    onSuccess: () => (refresh ? invalidateEntry(client, date) : undefined),
  });
}

export function useGenerate(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (opts: { skipRemainingQuestions?: boolean } = {}) =>
      unwrap(
        api.POST('/api/v1/entries/{date}/generate', {
          params: { path: { date } },
          body: opts,
          signal: timeoutSignal(AI_TIMEOUT_MS),
        }),
      ),
    onSuccess: () => invalidateEntry(client, date),
  });
}

export function useConfirm(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (finalContent: string) =>
      unwrap(
        api.POST('/api/v1/entries/{date}/confirm', {
          params: { path: { date } },
          body: { finalContent },
        }),
      ),
    onSuccess: (entry) => {
      client.setQueryData(entryKey(date), entry);
      void client.invalidateQueries({ queryKey: entriesKey });
    },
  });
}

export type EntrySummaryDto = components['schemas']['EntrySummaryDto'];

// 캘린더 목록 (월간·연간 공용, 최대 366일)
export function useEntriesRange(from: string, to: string) {
  return useQuery({
    queryKey: [...entriesKey, from, to],
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/v1/entries', { params: { query: { from, to } } }),
        )
      ).items,
  });
}

// 일기 삭제. 기억(AI 색인)을 먼저 지우므로 AI가 안 되면 503 AI_INDEX_UNAVAILABLE
export function useDeleteEntry(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/api/v1/entries/{date}', { params: { path: { date } } }),
      ),
    onSuccess: async () => {
      client.setQueryData(entryKey(date), null);
      await client.invalidateQueries({ queryKey: entriesKey });
    },
  });
}

// 기억에서 제외/복원 (확정된 일기만)
export function useUpdateMemory(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (excluded: boolean) =>
      unwrap(
        api.PATCH('/api/v1/entries/{date}/memory', {
          params: { path: { date } },
          body: { excluded },
        }),
      ),
    onSuccess: (entry) => {
      client.setQueryData(entryKey(date), entry);
      void client.invalidateQueries({ queryKey: entriesKey });
    },
  });
}
