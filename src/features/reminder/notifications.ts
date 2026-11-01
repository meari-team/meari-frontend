import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { todayKst } from '@/lib/dates';
import { reminderTimes } from '@/lib/reminder';

// 웹은 예약 알림을 지원하지 않는다
export const REMINDER_SUPPORTED = Platform.OS !== 'web';

export const REMINDER_TITLE = '오늘의 나를 남길 시간';
export const REMINDER_BODY =
  '지금 남긴 하루가 언젠가 미래의 나에게 메아리로 돌아와요.';

const PREFIX = 'diary-reminder-';
const CHANNEL = 'diary-reminder';

export const isReminder = (identifier: string) => identifier.startsWith(PREFIX);

if (REMINDER_SUPPORTED) {
  // 앱을 보고 있을 때 9시가 돼도 배너로 보여 준다
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// 권한이 없으면 한 번 묻는다. 이미 거절해서 다시 물을 수 없으면 false
async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelReminders() {
  if (!REMINDER_SUPPORTED) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => isReminder(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// 예약을 지금 상태에 맞춘다. 날짜별 고정 id라 여러 번 불려도 겹치지 않는다
// 반환: 권한이 막혀 예약하지 못했으면 'blocked'
export async function syncReminders(
  enabled: boolean,
  todayWritten: boolean,
): Promise<'ok' | 'blocked'> {
  if (!REMINDER_SUPPORTED) return 'ok';
  if (!enabled) {
    await cancelReminders();
    return 'ok';
  }
  if (!(await ensurePermission())) {
    await cancelReminders();
    return 'blocked';
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: '일기 알림',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const now = Date.now();
  const wanted = new Map(
    reminderTimes(now, todayWritten).map((t) => [`${PREFIX}${todayKst(t)}`, t]),
  );
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  // 쓴 날·지난 날처럼 더는 필요 없는 예약은 지운다
  await Promise.all(
    scheduled
      .filter((n) => isReminder(n.identifier) && !wanted.has(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  const have = new Set(scheduled.map((n) => n.identifier));
  for (const [identifier, date] of wanted) {
    if (have.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: REMINDER_TITLE, body: REMINDER_BODY },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL,
      },
    });
  }
  return 'ok';
}
