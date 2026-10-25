import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatKoreanDate, todayKst } from '@/lib/dates';
import { colors, spacing } from '@/theme';

// 오늘의 일기 큰 제목. 지난 날짜(?date=)면 날짜가 제목이 된다. right: 오른쪽 끝 (예: 1 / 2)
export function TodayTitle({
  date,
  right,
}: {
  date: string;
  right?: ReactNode;
}) {
  const past = date !== todayKst();
  return (
    <View style={styles.header}>
      {past ? <Text style={styles.eyebrow}>지난 날의 일기</Text> : null}
      <View style={styles.row}>
        <Text style={styles.title} testID="today-title">
          {past ? formatKoreanDate(date) : '오늘의 일기'}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2, paddingTop: spacing.sm },
  eyebrow: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, flexShrink: 1 },
});
