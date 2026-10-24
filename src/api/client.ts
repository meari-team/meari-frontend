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
