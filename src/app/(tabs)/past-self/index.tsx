import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
});
