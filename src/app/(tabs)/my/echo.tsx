import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  useDemoEcho,
  useEchoSettings,
  useUpdateEchoSettings,
  type EchoDto,
  type UpdateEchoSettings,
} from '@/api/echo';
import { errorMessage } from '@/api/errors';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import {
  PUSH_SUPPORTED,
  devicePermission,
  ensurePushRegistered,
  type DevicePermission,
} from '@/features/echo/push';
import {
  OutlineButton,
  SettingsGroup,
  SettingsRow,
} from '@/features/my/components';
import {
  WEEKDAY_LABELS,
  deviceTimeZone,
  echoSender,
  nextRunLabel,
  scheduleSummary,
  hourLabel,
  minuteLabel,
  shiftMinuteInHour,
  shiftMonthDay,
  shiftTime,
} from '@/lib/echo';
import { colors, fonts, warm } from '@/theme';

const switchColors = {
  trackColor: { false: warm.sand, true: warm.tan },
  thumbColor: warm.field,
  ios_backgroundColor: warm.sand,
  // 웹(react-native-web)은 켜진 손잡이 색을 따로 받는다
  ...({ activeThumbColor: warm.field } as object),
};

// 시연: 원격 푸시를 받을 수 없는 빌드(Expo Go 등)에서는 같은 모양의 알림을 기기에서 3초 뒤 띄운다
async function showDemoNotification(echo: EchoDto, showPreview: boolean) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '기억하고 싶었던 하루가 찾아왔어요',
      subtitle: echoSender(echo.entryDate),
      body: showPreview
        ? echo.preview
        : `${echoSender(echo.entryDate)} · 메시지가 도착했어요. 눌러서 확인해 보세요.`,
      data: { type: 'echo', echoId: echo.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}

// 메아리 설정: 전체 수신 동의 → 주기·요일(날짜)·시간 → 알림 미리보기 → 다음 수신 예정
export default function EchoSettingsScreen() {
  const settings = useEchoSettings();
  const update = useUpdateEchoSettings();
  const demo = useDemoEcho();
  const [permission, setPermission] = useState<DevicePermission>('unsupported');
  const [demoNote, setDemoNote] = useState<string | null>(null);

  // 설정 앱에서 돌아오면 권한을 다시 본다
  useFocusEffect(
    useCallback(() => {
      void devicePermission().then(setPermission);
      void settings.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (settings.isPending) return <StateView status="loading" />;
  if (settings.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(settings.error)}
        onRetry={() => void settings.refetch()}
      />
    );
  }

  const s = settings.data;
  const save = (body: UpdateEchoSettings) => update.mutate(body);

  const toggle = async (enabled: boolean) => {
    // 켤 때 기기 시간대를 함께 보내고, 기기 알림 권한을 묻는다 (거절해도 앱 안에서는 받는다)
    save(enabled ? { enabled, timezone: deviceTimeZone() } : { enabled });
    if (enabled && PUSH_SUPPORTED) {
      await ensurePushRegistered({ ask: true });
      setPermission(await devicePermission());
      void settings.refetch();
    }
  };

  const runDemo = () => {
    setDemoNote(null);
    demo.mutate(undefined, {
      onSuccess: async (echo) => {
        if (PUSH_SUPPORTED && permission === 'granted' && !s.pushRegistered) {
          await showDemoNotification(echo, s.showPreview);
          setDemoNote('3초 뒤 알림이 와요. 알림을 눌러 보세요.');
        } else if (PUSH_SUPPORTED && s.pushRegistered) {
          setDemoNote('푸시로 보냈어요. 잠시 뒤 알림이 와요.');
        } else {
          router.push({
            pathname: '/past-self/echo/[echoId]',
            params: { echoId: echo.id },
          });
        }
      },
    });
  };

  return (
    // 헤더 아래 화면이라 위쪽 안전 영역은 헤더에 맡긴다 (다른 마이페이지 하위 화면과 같게)
    <Screen edges={[]} backgroundColor={warm.background}>
      <Text style={styles.lead}>
        기억하고 싶은 날로 표시한 일기 중 하루가, 정한 주기마다 그날의 나에게서
        온 메시지로 찾아와요. 알림을 열면 바로 답장할 수 있어요.
      </Text>

      <SettingsGroup>
        <SettingsRow
          title="메아리 알림 받기"
          description={s.enabled ? scheduleSummary(s) : '꺼져 있어요'}
          accessory={
            <Switch
              value={s.enabled}
              onValueChange={(on) => void toggle(on)}
              disabled={update.isPending}
              accessibilityLabel="메아리 알림 받기"
              testID="echo-enabled"
              {...switchColors}
            />
          }
          last
        />
      </SettingsGroup>

      {s.candidateCount === 0 ? (
        <Text style={styles.hint} testID="echo-no-candidates">
          기억하고 싶은 날을 북마크하면 메아리가 찾아와요. 일기 상세에서
          ‘기억하고 싶은 날 ☆’을 눌러 보세요.
        </Text>
      ) : (
        <Text style={styles.hint}>
          기억하고 싶은 날 {s.candidateCount}편 중에서 골라 보내요.
        </Text>
      )}

      {s.enabled ? (
        <>
          <SettingsGroup title="연락 주기">
            <View style={styles.block}>
              <View style={styles.chips}>
                <Chip
                  label="주 1회"
                  selected={s.frequency === 'WEEKLY'}
                  onPress={() => save({ frequency: 'WEEKLY' })}
                  testID="echo-weekly"
                />
                <Chip
                  label="월 1회"
                  selected={s.frequency === 'MONTHLY'}
                  onPress={() => save({ frequency: 'MONTHLY' })}
                  testID="echo-monthly"
                />
              </View>
              {s.frequency === 'WEEKLY' ? (
                <View style={styles.chips}>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <Chip
                      key={label}
                      label={label}
                      selected={s.weekday === i}
                      onPress={() => save({ weekday: i })}
                    />
                  ))}
                </View>
              ) : (
                <View>
                  <Stepper
                    label={`매월 ${s.monthDay}일`}
                    onPrev={() =>
                      save({ monthDay: shiftMonthDay(s.monthDay, -1) })
                    }
                    onNext={() =>
                      save({ monthDay: shiftMonthDay(s.monthDay, 1) })
                    }
                  />
                  <Text style={styles.small}>
                    그달에 없는 날짜면 마지막 날에 보내요.
                  </Text>
                </View>
              )}
              {/* 시와 분을 따로: 분 단위로 맞출 수 있다 */}
              <View style={styles.timeRow}>
                <View style={styles.flex}>
                  <Stepper
                    label={hourLabel(s.time)}
                    onPrev={() => save({ time: shiftTime(s.time, -60) })}
                    onNext={() => save({ time: shiftTime(s.time, 60) })}
                    testID="echo-hour"
                  />
                </View>
                <View style={styles.flex}>
                  <Stepper
                    label={minuteLabel(s.time)}
                    onPrev={() => save({ time: shiftMinuteInHour(s.time, -1) })}
                    onNext={() => save({ time: shiftMinuteInHour(s.time, 1) })}
                    testID="echo-minute"
                  />
                </View>
              </View>
            </View>
          </SettingsGroup>

          <SettingsGroup title="알림">
            <SettingsRow
              title="알림에 메시지 내용 보이기"
              description={
                s.showPreview
                  ? '잠금 화면에 첫 메시지 앞부분이 보여요'
                  : '잠금 화면에는 “메시지가 도착했어요”만 보여요'
              }
              accessory={
                <Switch
                  value={s.showPreview}
                  onValueChange={(on) => save({ showPreview: on })}
                  accessibilityLabel="알림에 메시지 내용 보이기"
                  {...switchColors}
                />
              }
              last
            />
          </SettingsGroup>

          {s.nextRunAt ? (
            <Text style={styles.next} testID="echo-next">
              다음 메아리 · {nextRunLabel(s.nextRunAt, s.timezone)}
              {s.candidateCount === 0 ? ' (북마크가 없으면 건너뛰어요)' : ''}
            </Text>
          ) : null}

          {PUSH_SUPPORTED && permission !== 'granted' ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                기기 알림이 꺼져 있어요. 메아리는 과거의 나 탭에서 확인할 수
                있어요.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void Linking.openSettings()}
              >
                <Text style={styles.link}>알림 허용하러 가기</Text>
              </Pressable>
            </View>
          ) : PUSH_SUPPORTED && !s.pushRegistered ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                이 앱 버전은 서버 푸시를 받을 수 없어서, 이 기기에서 정한 시간
                1분 뒤에 알림을 띄워요. 도착한 메아리는 과거의 나 탭에서도 볼 수
                있어요.
              </Text>
            </View>
          ) : !PUSH_SUPPORTED ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                웹에서는 알림 없이 과거의 나 탭에서 메아리를 확인해요.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.small}>
          꺼 두는 동안에는 새 메아리를 만들지 않아요. 북마크와 받은 메아리는
          그대로 남아요.
        </Text>
      )}

      {s.demoAvailable ? (
        <View style={styles.demo}>
          <OutlineButton
            title={
              demo.isPending ? '만드는 중…' : '지금 메아리 받아 보기 (시연)'
            }
            disabled={demo.isPending}
            onPress={runDemo}
            testID="echo-demo"
          />
          {demoNote ? <Text style={styles.small}>{demoNote}</Text> : null}
          {demo.isError ? (
            <Text style={styles.error}>{errorMessage(demo.error)}</Text>
          ) : null}
        </View>
      ) : null}

      {update.isError ? (
        <Text style={styles.error}>{errorMessage(update.error)}</Text>
      ) : null}
    </Screen>
  );
}

function Stepper({
  label,
  onPrev,
  onNext,
  testID,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.stepper} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전"
        hitSlop={8}
        onPress={onPrev}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Text style={styles.stepArrow}>‹</Text>
      </Pressable>
      <Text style={styles.stepLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다음"
        hitSlop={8}
        onPress={onNext}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Text style={styles.stepArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: warm.ink,
  },
  hint: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: warm.brown,
    paddingHorizontal: 4,
  },
  block: { gap: 14, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flex: 1 },
  timeRow: { flexDirection: 'row', gap: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 6,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: warm.sand,
  },
  stepButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepArrow: { fontFamily: fonts.semibold, fontSize: 22, color: warm.brown },
  stepLabel: { fontFamily: fonts.semibold, fontSize: 15, color: warm.ink },
  pressed: { opacity: 0.6 },
  next: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.ink,
    textAlign: 'center',
  },
  small: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: warm.tan,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  notice: {
    gap: 6,
    padding: 14,
    borderRadius: 10,
    backgroundColor: warm.field,
  },
  noticeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: warm.ink,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    textDecorationLine: 'underline',
  },
  demo: { gap: 6, marginTop: 6 },
  error: { color: colors.danger, fontSize: 14 },
});
