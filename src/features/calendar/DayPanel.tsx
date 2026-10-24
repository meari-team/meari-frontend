import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ScheduleList } from '@/features/schedules/ScheduleList';
import { formatKoreanDate } from '@/lib/dates';
import { colors, spacing } from '@/theme';

type Props = { date: string; today: string; entry?: EntrySummaryDto };

// 월간에서 고른 날: 그날 일정(추가·수정·삭제) + 일기 보기/쓰기
export function DayPanel({ date, today, entry }: Props) {
  const future = date > today;
  const confirmed = entry?.status === 'CONFIRMED';

  return (
    <View style={styles.wrap} testID="day-panel">
      <View style={styles.header}>
        <Text style={styles.date}>{formatKoreanDate(date)}</Text>
        {date === today ? <Badge label="오늘" tone="info" /> : null}
        {confirmed ? <Badge label="일기 있음" tone="success" /> : null}
        {entry && !confirmed ? <Badge label="작성 중" tone="warning" /> : null}
      </View>

      <ScheduleList
        date={date}
        editable
        hint={
          future ? undefined : '등록한 일정은 AI가 그날 일기를 쓸 때 참고해요.'
        }
      />

      {future ? (
        <Text style={styles.note}>
          미래 날짜에는 일정만 넣을 수 있어요. 일기는 그날이 되면 써요.
        </Text>
      ) : confirmed ? (
        <Button
          title="일기 보기"
          testID="open-entry"
          onPress={() => router.push(`/entry/${date}`)}
        />
      ) : (
        <Button
          title={entry ? '이어 쓰기' : '이 날 일기 쓰기'}
          testID="write-entry"
          onPress={() => router.push(`/today?date=${date}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm + 4, marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontSize: 17, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
