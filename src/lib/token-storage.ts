import * as SecureStore from 'expo-secure-store';

const KEY = 'meari.accessToken';

// SecureStore는 iOS·Android 전용이다. 웹 등 지원하지 않는 환경에서는 메모리에만 둔다.
let memory: string | null = null;

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const tokenStorage = {
  async get(): Promise<string | null> {
    return (await available()) ? SecureStore.getItemAsync(KEY) : memory;
  },
  async set(token: string): Promise<void> {
    if (await available()) await SecureStore.setItemAsync(KEY, token);
    else memory = token;
  },
  async clear(): Promise<void> {
    if (await available()) await SecureStore.deleteItemAsync(KEY);
    else memory = null;
  },
};
