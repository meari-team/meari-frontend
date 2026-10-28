import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { SafeImage } from '@/components/SafeImage';
import { groupByMonth } from '@/lib/calendar';
import { fonts, spacing, warm } from '@/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const GAP = 10;

type Props = {
  entries: EntrySummaryDto[];
  onPressEntry: (date: string) => void;
};

const dayLabel = (date: string) =>
  `${Number(date.slice(8))}일 ${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]}`;

// 연간 보관함: 기록이 있는 날의 대표 사진을 달별로, 사진첩처럼 3열 + 사진 아래 날짜 (기획안 "사진 보관함")
export function YearView({ entries, onPressEntry }: Props) {
  return (
    <View style={styles.wrap}>
      {groupByMonth(entries).map((group) => (
        <View key={group.month} style={styles.group}>
          <View style={styles.monthRow}>
            <Text style={styles.month}>{group.month}월</Text>
            <Text style={styles.count}>{group.items.length}일 기록</Text>
          </View>
          <View style={styles.grid}>
            {group.items.map((e) => {
              const writing = e.status !== 'CONFIRMED';
              return (
                <Pressable
                  key={e.date}
                  testID={`archive-${e.date}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${Number(e.date.slice(5, 7))}월 ${Number(
                    e.date.slice(8),
                  )}일 일기${writing ? ', 작성 중' : ''}`}
                  onPress={() => onPressEntry(e.date)}
                  style={({ pressed }) => [
                    styles.cell,
                    pressed && styles.pressed,
                  ]}
                >
                  <SafeImage
                    uri={e.coverPhotoUrl}
                    style={[styles.image, writing && styles.faded]}
                  />
                  {/* 작성 중은 사진을 흐리게 하고 날짜 옆에 글자로만 */}
                  <Text style={styles.caption} numberOfLines={1}>
                    {dayLabel(e.date)}
                    {writing ? (
                      <Text style={styles.writing}> · 작성 중</Text>
                    ) : null}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  group: { gap: 12 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  month: { fontFamily: fonts.bold, fontSize: 18, color: warm.ink },
  count: { fontFamily: fonts.medium, fontSize: 13, color: warm.tan },
  // 칸마다 안쪽 여백을 두고 바깥을 같은 만큼 당겨 3열을 정확히 나눈다
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GAP / 2,
    rowGap: 14,
  },
  cell: { width: '33.333%', paddingHorizontal: GAP / 2, gap: 6 },
  pressed: { opacity: 0.7 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 7 },
  faded: { opacity: 0.55 },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: warm.brown },
  writing: { color: warm.clay },
});
