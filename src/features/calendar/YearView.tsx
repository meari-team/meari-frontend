import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { SafeImage } from '@/components/SafeImage';
import { monthGrid, type YearMonth } from '@/lib/calendar';
import { fonts, warm } from '@/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY = 45;

type Props = {
  year: number;
  entries: EntrySummaryDto[];
  onPressEntry: (date: string) => void;
};

// 연간 캘린더 (시안 2:31): 기록이 있는 달마다 작은 달력. 일기를 쓴 날은 그날 대표 사진을 동그랗게,
// 그 위에 흰 날짜. 안 쓴 날은 황갈색 날짜만. 달은 오래된 것부터 (맨 아래가 최근)
export function YearView({ year, entries, onPressEntry }: Props) {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const months = [...new Set(entries.map((e) => Number(e.date.slice(5, 7))))]
    .sort((a, b) => a - b)
    .map((month): YearMonth => ({ year, month }));

  return (
    <View style={styles.wrap}>
      {months.map((ym) => (
        <View
          key={ym.month}
          style={styles.month}
          testID={`year-month-${ym.month}`}
        >
          <Text style={styles.monthTitle}>{ym.month}월</Text>
          <View style={styles.row}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
          {monthGrid(ym).map((week, wi) => (
            <View key={wi} style={styles.row}>
              {week.map((date, di) => {
                if (!date)
                  return <View key={`blank-${di}`} style={styles.cell} />;
                const entry = byDate.get(date);
                const day = Number(date.slice(8));
                if (!entry) {
                  return (
                    <View key={date} style={styles.cell}>
                      <View style={styles.day}>
                        <Text style={styles.dayText}>{day}</Text>
                      </View>
                    </View>
                  );
                }
                const writing = entry.status !== 'CONFIRMED';
                return (
                  <View key={date} style={styles.cell}>
                    <Pressable
                      testID={`archive-${date}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${ym.month}월 ${day}일 일기${writing ? ', 작성 중' : ''}`}
                      onPress={() => onPressEntry(date)}
                      style={({ pressed }) => [
                        styles.day,
                        writing && styles.faded,
                        pressed && styles.pressed,
                      ]}
                    >
                      {/* 사진이 없으면 모래색 동그라미 */}
                      {entry.coverPhotoUrl ? (
                        <SafeImage
                          uri={entry.coverPhotoUrl}
                          style={styles.photo}
                          showIcon={false}
                        />
                      ) : (
                        <View style={styles.photo} />
                      )}
                      <View style={styles.shade} />
                      <Text style={[styles.dayText, styles.dayOnPhoto]}>
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 50, paddingBottom: 24 },
  month: { gap: 8 },
  monthTitle: {
    marginLeft: 10,
    marginBottom: 16,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: warm.black,
  },
  // 7칸을 똑같이 나눠 칸 가운데에 45 동그라미
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  weekday: {
    flex: 1,
    marginBottom: 3,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: warm.ink,
  },
  day: {
    width: DAY,
    height: DAY,
    borderRadius: DAY / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    ...StyleSheet.absoluteFill,
    borderRadius: DAY / 2,
    backgroundColor: warm.sand,
  },
  // 흰 날짜가 밝은 사진 위에서도 보이게 살짝 어둡게
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(74,52,42,0.18)',
  },
  dayText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 23,
    color: warm.tan,
  },
  dayOnPhoto: { color: '#FFFFFF' },
  faded: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});
