import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shortDate } from '@/features/home/logic';
import { todayKst } from '@/lib/dates';
import { fonts, warm } from '@/theme';

// 오늘의 일기 머리말 (시안): 위에 날짜 "10/29 (목)", 아래 큰 제목. 지난 날짜(?date=)면 "지난 날의 일기".
// right: 제목 줄 오른쪽 끝 (예: 1/2)
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
      <Text style={styles.date}>{shortDate(date)}</Text>
      <View style={styles.row}>
        <Text style={styles.title} testID="today-title">
          {past ? '지난 날의 일기' : '오늘의 일기'}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 11 },
  date: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: warm.brown,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 29,
    color: warm.black,
    flexShrink: 1,
  },
});
