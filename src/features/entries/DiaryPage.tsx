import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChecklistCategoryDto, EntryDto, PhotoDto } from '@/api/entries';
import { useDaySchedules } from '@/api/schedules';
import { SafeImage } from '@/components/SafeImage';
import { colors, fonts, spacing, warm } from '@/theme';
import { checkedLabels, longKoreanDate, memoryLineOf } from './diary-page';

// 확정한 일기 한 쪽: 날짜 · 한 줄(제목) · 사진 · 본문 · 체크한 항목 · 기억 상태(제외·실패일 때만).
// 오늘의 일기(확정 후)와 일기 상세가 함께 쓴다. 종이 일기장처럼 조용하게
export function DiaryPage({
  date,
  entry,
  categories,
  showDate = true,
}: {
  date: string;
  entry: EntryDto;
  categories: ChecklistCategoryDto[];
  // 오늘의 일기처럼 위에 날짜가 이미 있으면 끈다
  showDate?: boolean;
}) {
  const note = entry.note?.trim();
  const checked = checkedLabels(categories, entry.checkedItemIds);
  const memory = memoryLineOf(entry.aiIndexStatus, entry.excludedFromMemory);

  return (
    <View style={styles.page} testID="diary-page">
      {showDate ? (
        <Text style={styles.date}>{longKoreanDate(date)}</Text>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}

      {entry.photos.length > 0 ? <Photos photos={entry.photos} /> : null}

      <Text style={styles.body} selectable testID="entry-content">
        {entry.finalContent}
      </Text>

      {checked.length > 0 ? (
        <View style={styles.tags}>
          {checked.map((label) => (
            <Text key={label} style={styles.tag}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}

      {memory ? (
        <View style={styles.footer} testID="memory-line">
          <Text style={[styles.footerText, memory.failed && styles.failed]}>
            {memory.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// 사진: 한 장이면 크게, 여러 장이면 큰 사진 + 아래 작은 사진(눌러서 바꿔 보기)
function Photos({ photos }: { photos: PhotoDto[] }) {
  const [index, setIndex] = useState(0);
  const current = photos[Math.min(index, photos.length - 1)];
  return (
    <View style={styles.photos}>
      <SafeImage
        uri={current.url}
        style={styles.photo}
        accessibilityLabel={current.caption ?? `사진 ${index + 1}`}
      />
      {photos.length > 1 ? (
        <View style={styles.thumbs}>
          {photos.map((p, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`사진 ${i + 1} 보기`}
              accessibilityState={{ selected: i === index }}
              onPress={() => setIndex(i)}
              style={[styles.thumbWrap, i === index && styles.thumbOn]}
            >
              <SafeImage uri={p.url} style={styles.thumb} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// 그날 일정: 일기 아래 조용한 목록 (시간 없으면 할 일이라 시간 칸 없음)
export function DaySchedulesQuiet({ date }: { date: string }) {
  const list = useDaySchedules(date);
  const items = list.data ?? [];
  if (items.length === 0) return null;
  return (
    <View style={styles.schedules} testID="day-schedules">
      <Text style={styles.schedulesLabel}>이 날 일정</Text>
      {items.map((s) => (
        <View key={s.id} style={styles.scheduleRow}>
          {s.time ? <Text style={styles.scheduleTime}>{s.time}</Text> : null}
          <Text
            style={[styles.scheduleTitle, s.completed && styles.scheduleDone]}
            numberOfLines={2}
          >
            {s.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 홈 카드와 같은 종이 한 장 (바탕 + 갈색 그림자)
  page: {
    backgroundColor: warm.field,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    gap: spacing.md,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  date: { fontFamily: fonts.medium, fontSize: 13, color: warm.tan },
  // 시안 "일기내용 저장후": 한 줄 제목 16, 본문 13
  note: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: warm.black,
    marginTop: -spacing.xs,
  },
  photos: { gap: spacing.sm },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 7,
    backgroundColor: warm.background,
  },
  thumbs: { flexDirection: 'row', gap: spacing.sm },
  thumbWrap: {
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.55,
  },
  thumbOn: { borderColor: warm.tan, opacity: 1 },
  thumb: { width: 56, height: 56, borderRadius: 7 },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.black,
  },

  // 체크한 항목: 모래색 테두리의 작은 알약 (아이콘 없이 글자만)
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: warm.brown,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: warm.sand,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: warm.sand,
  },
  footerText: { fontFamily: fonts.medium, fontSize: 13, color: warm.tan },
  failed: { color: colors.danger },
  schedules: { gap: 10, paddingHorizontal: 4 },
  schedulesLabel: { fontFamily: fonts.semibold, fontSize: 13, color: warm.tan },
  scheduleRow: { flexDirection: 'row', gap: 12 },
  scheduleTime: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.ink,
    fontVariant: ['tabular-nums'],
  },
  scheduleTitle: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: warm.black,
  },
  scheduleDone: { color: warm.tan, textDecorationLine: 'line-through' },
});
