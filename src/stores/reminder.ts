import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'meari.reminderEnabled';

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

type ReminderState = {
  // null: 저장된 설정을 읽는 중. 처음 쓰는 사람은 켜진 상태로 시작한다
  enabled: boolean | null;
  // 폰에서 알림 권한을 막아 둔 경우 (설정 앱에서 풀어야 한다)
  blocked: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  setBlocked: (blocked: boolean) => void;
};

export const useReminder = create<ReminderState>((set) => ({
  enabled: null,
  blocked: false,
  async hydrate() {
    const saved = (await available())
      ? await SecureStore.getItemAsync(KEY)
      : null;
    set({ enabled: saved !== 'off' });
  },
  async setEnabled(enabled) {
    set({ enabled });
    if (await available())
      await SecureStore.setItemAsync(KEY, enabled ? 'on' : 'off');
  },
  setBlocked(blocked) {
    set({ blocked });
  },
}));
