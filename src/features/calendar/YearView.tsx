import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EntrySummaryDto } from '@/api/entries';
import { SafeImage } from '@/components/SafeImage';
import { groupByMonth } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

type Props = {
  entries: EntrySummaryDto[];
  onPressEntry: (date: string) => void;
};

// 연간 보관함: 기록이 있는 날의 대표 사진을 달별로 (기획안 "사진 보관함")
export function YearView({ entries, onPressEntry }: Props) {
  return (
    <View style={styles.wrap}>
      {groupByMonth(entries).map((group) => (
        <View key={group.month} style={styles.group}>
          <Text style={styles.month}>{group.month}월</Text>
          <View style={styles.grid}>
            {group.items.map((e) => (
              <Pressable
                key={e.date}
                testID={`archive-${e.date}`}
                accessibilityRole="button"
                accessibilityLabel={`${Number(e.date.slice(5, 7))}월 ${Number(
                  e.date.slice(8),
                )}일 일기`}
                onPress={() => onPressEntry(e.date)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && styles.pressed,
                ]}
              >
                <SafeImage uri={e.coverPhotoUrl} style={styles.image} />
                <View style={styles.label}>
                  <Text style={styles.labelText}>
                    {Number(e.date.slice(8))}
                  </Text>
                </View>
                {e.status !== 'CONFIRMED' ? (
                  <View style={styles.writing}>
                    <Text style={styles.writingText}>작성 중</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  group: { gap: spacing.sm },
  month: { fontSize: 16, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tile: {
    width: '23.5%',
    aspectRatio: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.8 },
  image: { width: '100%', height: '100%' },
  label: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  labelText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  writing: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  writingText: { fontSize: 10, color: colors.textMuted },
});
