import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { api } from '@/api/client';
import { echoesKey, echoSettingsKey, useEchoSettings } from '@/api/echo';
import { unwrap } from '@/api/errors';
import { PUSH_SUPPORTED, devicePermission, ensurePushRegistered } from './push';

// 원격 푸시를 받을 수 없는 빌드(Expo Go·EAS 프로젝트 없음)용 기기 알림
const LOCAL_ID = 'echo-next-local';
// 서버 예약 작업이 1분마다 돌아서, 회차 시각 뒤 1분이면 메아리가 이미 만들어져 있다
const LOCAL_DELAY_MS = 60_000;

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

  // 원격 푸시가 없으면 다음 회차 시각(+1분)에 기기 알림을 걸어 둔다.
  // 어떤 날이 올지는 서버가 그때 고르므로 날짜·내용 없이 일반 문구로, 누르면 가장 최근 메아리를 연다
  const s = settings.data;
  const localAt =
    s?.enabled && !s.pushRegistered && s.candidateCount > 0 && s.nextRunAt
      ? new Date(s.nextRunAt).getTime() + LOCAL_DELAY_MS
      : null;
  useEffect(() => {
    if (!PUSH_SUPPORTED) return;
    void (async () => {
      await Notifications.cancelScheduledNotificationAsync(LOCAL_ID).catch(
        () => {},
      );
      if (!localAt || localAt <= Date.now()) return;
      if ((await devicePermission()) !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        identifier: LOCAL_ID,
        content: {
          title: '기억하고 싶었던 하루가 찾아왔어요',
          body: '그날의 나에게서 메시지가 도착했어요. 눌러서 확인해 보세요.',
          data: { type: 'echo-next' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: localAt,
        },
      });
    })();
  }, [localAt]);

  // 앱으로 돌아오면 설정(다음 회차)과 받은 메아리를 다시 읽는다
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void client.invalidateQueries({ queryKey: echoSettingsKey });
      void client.invalidateQueries({ queryKey: echoesKey });
    });
    return () => sub.remove();
  }, [client]);

  useEffect(() => {
    if (!PUSH_SUPPORTED) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data as EchoData;
      // 기기 알림(원격 푸시 없는 빌드): 가장 최근 메아리로
      if (data?.type === 'echo-next') {
        Notifications.clearLastNotificationResponse();
        void openLatest();
        return;
      }
      const echoId = echoIdOf(response.notification);
      if (!echoId) return;
      Notifications.clearLastNotificationResponse();
      void client.invalidateQueries({ queryKey: echoesKey });
      router.push({ pathname: '/past-self/echo/[echoId]', params: { echoId } });
    };
    // 앱이 꺼져 있을 때 눌러서 켠 경우
    void Notifications.getLastNotificationResponseAsync().then(open);
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    const openLatest = async () => {
      try {
        const list = await unwrap(api.GET('/api/v1/echoes'));
        void client.invalidateQueries({ queryKey: echoesKey });
        void client.invalidateQueries({ queryKey: echoSettingsKey });
        const latest = list.items[0];
        if (latest) {
          router.push({
            pathname: '/past-self/echo/[echoId]',
            params: { echoId: latest.id },
          });
        } else {
          router.push('/past-self/echoes');
        }
      } catch {
        router.push('/past-self/echoes');
      }
    };
    const received = Notifications.addNotificationReceivedListener((n) => {
      const type = (n.request.content.data as EchoData | undefined)?.type;
      if (type === 'echo' || type === 'echo-next') {
        void client.invalidateQueries({ queryKey: echoesKey });
        void client.invalidateQueries({ queryKey: echoSettingsKey });
      }
    });
    return () => {
      tapped.remove();
      received.remove();
    };
  }, [client]);
}
