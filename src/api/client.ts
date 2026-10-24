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
  async onResponse({ response, schemaPath }) {
    if (response.status === 401 && !PUBLIC_PATHS.includes(schemaPath)) {
      await useAuth.getState().signOut();
    }
    return response;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);
