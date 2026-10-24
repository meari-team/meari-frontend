import type { components } from './schema';

export type ErrorCode = components['schemas']['ErrorCode'];
type ErrorResponse = components['schemas']['ErrorResponseDto'];

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
  ) {
    super(message);
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorResponse).error?.code === 'string'
  );
}

// openapi-fetch 결과를 data로 풀고, 실패면 ApiError를 던진다 (TanStack Query가 잡는다).
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: Awaited<typeof call>;
  try {
    result = await call;
  } catch (e) {
    if (__DEV__) console.warn('[api] 요청 실패', e);
    const name = e instanceof Error ? e.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new ApiError(
        'AI_TIMEOUT',
        '응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.',
      );
    }
    throw new ApiError(
      'NETWORK_ERROR',
      '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.',
    );
  }
  if (result.error !== undefined || !result.response.ok) {
    if (isErrorResponse(result.error)) {
      throw new ApiError(result.error.error.code, result.error.error.message);
    }
    throw new ApiError('INTERNAL_ERROR', '일시적인 오류가 발생했어요.');
  }
  return result.data as T;
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.';
