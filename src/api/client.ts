import createClient, { type Middleware } from 'openapi-fetch';
import { API_URL } from '@/lib/env';
import { useAuth } from '@/stores/auth';
import type { paths } from './schema';

// 401은 "토큰이 없거나 만료·무효"다. 로그인 API의 401(비밀번호 틀림)은 제외한다.
const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/signup'];

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const { token } = useAuth.getState();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  // 응답을 바꾸지 않으므로 아무것도 반환하지 않는다.
  // 같은 Response를 반환하면 RN에서 openapi-fetch가 "must return new Response()" 에러를 던진다.
  async onResponse({ response, schemaPath }) {
    if (response.status === 401 && !PUBLIC_PATHS.includes(schemaPath)) {
      await useAuth.getState().signOut();
    }
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);

// 파일 업로드(multipart)는 openapi-fetch를 거치지 않고 fetch에 FormData를 직접 넘긴다.
// RN의 FormData 파일 항목({ uri, name, type })은 네이티브 fetch만 이해한다.
// openapi-fetch가 만드는 Request 객체를 거치면 iOS·Android에서 업로드가 실패한다 (웹은 정상).
// 결과 모양은 openapi-fetch와 같게 맞춰 unwrap()을 그대로 쓴다.
export async function postForm<T>(
  path: string,
  form: FormData,
): Promise<{ data?: T; error?: unknown; response: Response }> {
  const { token } = useAuth.getState();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (response.status === 401) await useAuth.getState().signOut();

  let body: unknown = undefined;
  try {
    body = await response.json();
  } catch {
    // 본문이 JSON이 아니면 unwrap이 상태 코드로 처리한다
  }
  return response.ok
    ? { data: body as T, response }
    : { error: body ?? {}, response };
}
