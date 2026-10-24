import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMe } from '@/api/auth';
import { Screen } from '@/components/Screen';
import {
  OnThisDay,
  PastSelfShortcuts,
  RecentEntries,
  RecordStats,
  TodayCard,
  TodaySchedules,
} from '@/features/home/sections';
import { formatKoreanDate, todayKst } from '@/lib/dates';
import { colors, spacing } from '@/theme';

// 홈: 오늘 할 일과 지난 기록을 한눈에. 섹션마다 따로 불러오고 따로 실패한다
export default function HomeScreen() {
  const today = todayKst();
  const me = useMe();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // 당겨서 새로고침: 홈에 떠 있는 쿼리를 모두 다시 읽는다
  const refresh = async () => {
    setRefreshing(true);
    try {
      await client.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  const name = me.data?.nickname;
  return (
    <Screen edges={['top']} refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.greeting}>
        <Text style={styles.date}>{formatKoreanDate(today)}</Text>
        <Text style={styles.hello} testID="home-greeting">
          {name ? `${name}님, ` : ''}오늘 하루는 어땠나요?
        </Text>
      </View>

      <TodayCard today={today} />
      <TodaySchedules today={today} />
      <OnThisDay today={today} />
      <PastSelfShortcuts />
      <RecentEntries />
      <RecordStats today={today} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: spacing.xs, paddingTop: spacing.sm },
  date: { fontSize: 14, color: colors.textMuted },
  hello: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
  },
});
