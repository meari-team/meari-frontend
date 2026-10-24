import { create } from 'zustand';
import { tokenStorage } from '@/lib/token-storage';

type AuthState = {
  // loading: 저장된 토큰을 읽는 중 (스플래시 유지)
  status: 'loading' | 'signedOut' | 'signedIn';
  token: string | null;
  hydrate: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  token: null,
  async hydrate() {
    const token = await tokenStorage.get();
    set({ token, status: token ? 'signedIn' : 'signedOut' });
  },
  async signIn(token) {
    await tokenStorage.set(token);
    set({ token, status: 'signedIn' });
  },
  async signOut() {
    await tokenStorage.clear();
    set({ token: null, status: 'signedOut' });
  },
}));
