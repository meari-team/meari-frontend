import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { echoesKey, useEchoSettings } from '@/api/echo';
import { PUSH_SUPPORTED, ensurePushRegistered } from './push';

type EchoData = { type?: string; echoId?: string };

const echoIdOf = (n: Notifications.Notification): string | null => {
  const data = n.request.content.data as EchoData | undefined;
  return data?.type === 'echo' && typeof data.echoId === 'string'
    ? data.echoId
    : null;
};

// 로그인한 동안 탭 레이아웃에서 한 번 쓴다
// - 메아리 알림에 동의했으면 이 기기 푸시 토큰을 서버에 등록한다 (권한은 설정 화면에서 묻는다)
// - 메아리 알림을 누르면 그 메아리(대화방)로 간다
// - 앱을 보고 있을 때 도착하면 받은 메아리 목록을 새로 읽는다
export function useEchoNotifications() {
  const client = useQueryClient();
  const settings = useEchoSettings();
  const enabled = settings.data?.enabled === true;

  useEffect(() => {
    if (enabled) void ensurePushRegistered({ ask: false });
  }, [enabled]);

  useEffect(() => {
    if (!PUSH_SUPPORTED) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const echoId = response ? echoIdOf(response.notification) : null;
      if (!echoId) return;
      Notifications.clearLastNotificationResponse();
      void client.invalidateQueries({ queryKey: echoesKey });
      router.push({ pathname: '/past-self/echo/[echoId]', params: { echoId } });
    };
    // 앱이 꺼져 있을 때 눌러서 켠 경우
    void Notifications.getLastNotificationResponseAsync().then(open);
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    const received = Notifications.addNotificationReceivedListener((n) => {
      if (echoIdOf(n)) void client.invalidateQueries({ queryKey: echoesKey });
    });
    return () => {
      tapped.remove();
      received.remove();
    };
  }, [client]);
}
