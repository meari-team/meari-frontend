import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken, removePushToken } from '@/api/echo';

// 원격 푸시(메아리 알림)는 휴대폰 앱에서만. 웹은 앱 안 목록으로만 확인한다
export const PUSH_SUPPORTED =
  Platform.OS === 'ios' || Platform.OS === 'android';

export type DevicePermission =
  'granted' | 'denied' | 'undetermined' | 'unsupported';

// Expo 푸시 토큰에는 EAS 프로젝트 id가 필요하다 (app.json extra.eas.projectId)
const projectId: string | undefined =
  Constants.easConfig?.projectId ??
  (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)
    ?.projectId;

let registered: string | null = null;

export async function devicePermission(): Promise<DevicePermission> {
  if (!PUSH_SUPPORTED) return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export type PushRegistration =
  | 'registered'
  | 'denied' // 기기 알림이 막혀 있다 → 앱 안에서만
  | 'unavailable' // 이 빌드는 원격 푸시를 받을 수 없다 (EAS 프로젝트 없음·안드로이드 Expo Go 등)
  | 'unsupported'; // 웹

// 기기 알림 권한을 (ask면 한 번 물어서) 얻고, Expo 푸시 토큰을 서버에 등록한다
export async function ensurePushRegistered(opts: {
  ask: boolean;
}): Promise<PushRegistration> {
  if (!PUSH_SUPPORTED) return 'unsupported';
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && opts.ask && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return 'denied';
  if (!projectId) return 'unavailable';
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('echo', {
        name: '메아리',
        importance: AndroidImportance.HIGH,
      });
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(data, Platform.OS as 'ios' | 'android');
    registered = data;
    return 'registered';
  } catch (e) {
    if (__DEV__) console.warn('[push] 토큰 등록 실패', e);
    return 'unavailable';
  }
}

// 로그아웃 전에 이 기기 토큰을 서버에서 지운다 (실패해도 로그아웃은 계속)
export async function forgetPushToken(): Promise<void> {
  if (!registered) return;
  const token = registered;
  registered = null;
  try {
    await removePushToken(token);
  } catch {
    // 다음 발송 때 서버가 무효 토큰을 정리한다
  }
}
