import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useEntry } from '@/api/entries';
import { todayKst } from '@/lib/dates';
import { useReminder } from '@/stores/reminder';
import { REMINDER_SUPPORTED, isReminder, syncReminders } from './notifications';

// 로그인한 동안 탭 레이아웃에서 한 번 쓴다
// - 설정·오늘 일기 상태가 바뀌거나 앱으로 돌아올 때 9시 알림 예약을 다시 맞춘다
// - 알림을 눌러 들어오면 오늘의 일기로
export function useDiaryReminder() {
  const enabled = useReminder((s) => s.enabled);
  const hydrate = useReminder((s) => s.hydrate);
  const setBlocked = useReminder((s) => s.setBlocked);
  // 앱으로 돌아올 때마다 바뀌어서 날짜가 넘어갔는지·권한이 바뀌었는지 다시 본다
  const [resumedAt, setResumedAt] = useState(() => Date.now());
  const today = todayKst(resumedAt);
  const entry = useEntry(today, { enabled: REMINDER_SUPPORTED });
  const written = entry.data?.status === 'CONFIRMED';
  const entryReady = !entry.isPending;

  useEffect(() => {
    if (REMINDER_SUPPORTED) void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setResumedAt(Date.now());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!REMINDER_SUPPORTED || enabled === null || !entryReady) return;
    syncReminders(enabled, written)
      .then((result) => setBlocked(result === 'blocked'))
      .catch(() => {});
  }, [enabled, written, entryReady, resumedAt, setBlocked]);

  useEffect(() => {
    if (!REMINDER_SUPPORTED) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || !isReminder(response.notification.request.identifier))
        return;
      // 다시 로그인해도 같은 알림으로 또 이동하지 않게 지운다
      Notifications.clearLastNotificationResponse();
      router.navigate('/today');
    };
    // 앱이 꺼져 있을 때 눌러서 켠 경우
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
