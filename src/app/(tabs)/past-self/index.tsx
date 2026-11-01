import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEchoes } from '@/api/echo';
import { useEntriesRange } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { usePresets } from '@/api/past-self';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { shiftDate } from '@/features/home/logic';
import {
  DateSheet,
  PresetTabs,
  SelfBar,
  Timeline,
} from '@/features/past-self/components';
import { defaultAnchor } from '@/features/past-self/logic';
import { isDateString, todayKst } from '@/lib/dates';
import { echoSender } from '@/lib/echo';
import { fonts, warm } from '@/theme';

const topDecor = require('../../../../assets/images/decor/past-top.png');
const chatsIcon = require('../../../../assets/images/tabs/past-self.png');

// 과거의 나: 시점 탭·기록 흐름에서 날짜를 고르고, 아래 카드에서 그날의 나와 대화한다 (prd.md §7-2)
// 지난 대화는 오른쪽 위 말풍선 버튼으로
export default function PastSelfHome() {
  const params = useLocalSearchParams<{ anchorDate?: string }>();
  const today = todayKst();
  const presets = usePresets();
  // 조회 범위는 최대 366일 (1년 전 프리셋까지)
  const entries = useEntriesRange(shiftDate(today, { days: -365 }), today);
  const [picked, setPicked] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const echoes = useEchoes();
  const latestEcho = echoes.data?.items[0];

  // 일기 상세 등에서 날짜를 들고 오면 바로 시점 확인으로
  if (isDateString(params.anchorDate)) {
    return (
      <Redirect
        href={{
          pathname: '/past-self/confirm',
          params: { anchorDate: params.anchorDate },
        }}
      />
    );
  }

  if (presets.isPending || entries.isPending) {
    return <StateView status="loading" />;
  }
  if (presets.isError || entries.isError) {
    const failed = presets.isError ? presets : entries;
    return (
      <StateView
        status="error"
        message={errorMessage(failed.error)}
        onRetry={() => {
          void presets.refetch();
          void entries.refetch();
        }}
      />
    );
  }

  const anchor = picked ?? defaultAnchor(presets.data, entries.data, today);

  return (
    <View style={styles.flex}>
      {/* 위쪽 동심원 장식 (시안). 화면에 고정되고 카드가 위로 지나간다 */}
      <View style={styles.decor} pointerEvents="none">
        <Image source={topDecor} style={styles.decorImage} />
      </View>
      <Screen edges={['top']} backgroundColor="transparent">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>과거의 나</Text>
            <Pressable
              testID="sessions-all"
              accessibilityRole="button"
              accessibilityLabel="지난 대화"
              hitSlop={10}
              onPress={() => router.push('/past-self/sessions')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Image source={chatsIcon} style={styles.chats} />
            </Pressable>
          </View>
          <Text style={styles.lead}>
            고른 날까지의 기록만 아는 나와 대화해요.
          </Text>
        </View>

        {/* 기억하고 싶은 날에서 먼저 온 연락 (도착한 게 있을 때만) */}
        {latestEcho ? (
          <View style={styles.echoCard}>
            <Pressable
              accessibilityRole="button"
              testID="echo-card"
              onPress={() =>
                router.push({
                  pathname: '/past-self/echo/[echoId]',
                  params: { echoId: latestEcho.id },
                })
              }
              style={({ pressed }) => [
                styles.echoMain,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.echoHead}>
                {!latestEcho.readAt ? <View style={styles.echoDot} /> : null}
                <Text style={styles.echoTitle}>
                  {echoSender(latestEcho.entryDate)}에게서 메아리가 왔어요
                </Text>
              </View>
              <Text style={styles.echoPreview} numberOfLines={2}>
                {latestEcho.preview}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push('/past-self/echoes')}
              testID="echo-all"
            >
              <Text style={styles.echoAll}>
                받은 메아리 모두 보기
                {echoes.data && echoes.data.unreadCount > 0
                  ? ` · 안 읽음 ${echoes.data.unreadCount}`
                  : ''}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <PresetTabs presets={presets.data} anchor={anchor} onPick={setPicked} />
        <Timeline
          entries={entries.data}
          today={today}
          anchor={anchor}
          onPick={setPicked}
          onPickOther={() => setSheetOpen(true)}
        />
        <SelfBar anchor={anchor} entries={entries.data} />
      </Screen>

      <DateSheet
        visible={sheetOpen}
        today={today}
        anchor={anchor}
        entries={entries.data}
        onPick={(date) => {
          setPicked(date);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: warm.background },
  // 웹은 Image의 aspectRatio를 무시해서 크기는 감싼 View가 정한다
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 402 / 473,
  },
  decorImage: { width: '100%', height: '100%' },
  header: { gap: 10 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.bold, fontSize: 24, color: warm.black },
  chats: { width: 30, height: 30, tintColor: warm.ink },
  lead: { fontFamily: fonts.semibold, fontSize: 14, color: warm.brown },
  pressed: { opacity: 0.6 },
  echoCard: {
    gap: 8,
    padding: 18,
    borderRadius: 10,
    backgroundColor: warm.field,
    borderWidth: 1.5,
    borderColor: warm.tan,
  },
  echoMain: { gap: 8 },
  echoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  echoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: warm.clay },
  echoTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: warm.black,
  },
  echoPreview: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: warm.brown,
  },
  echoAll: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: warm.tan,
    textDecorationLine: 'underline',
  },
});
