import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEntriesRange } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useChatSessions, usePresets } from '@/api/past-self';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { shiftDate } from '@/features/home/logic';
import {
  DateSheet,
  PresetTabs,
  RecentSessions,
  SelfBar,
  Timeline,
} from '@/features/past-self/components';
import { defaultAnchor } from '@/features/past-self/logic';
import { isDateString, todayKst } from '@/lib/dates';
import { colors, spacing } from '@/theme';

// 과거의 나: 시점 탭·기록 흐름에서 날짜를 고르고, 아래 고정 바에서 그날의 나와 대화한다 (prd.md §7-2)
export default function PastSelfHome() {
  const params = useLocalSearchParams<{ anchorDate?: string }>();
  const today = todayKst();
  const presets = usePresets();
  // 조회 범위는 최대 366일 (1년 전 프리셋까지)
  const entries = useEntriesRange(shiftDate(today, { days: -365 }), today);
  const sessions = useChatSessions();
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
      <Screen
        edges={['top']}
        footer={<SelfBar anchor={anchor} entries={entries.data} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>과거의 나</Text>
          <Text style={styles.lead}>
            고른 날까지의 기록만 아는 나와 대화해요
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
        <RecentSessions
          sessions={sessions.data}
          pending={sessions.isPending}
          error={sessions.error}
          onRetry={() => void sessions.refetch()}
        />
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
  flex: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
});
