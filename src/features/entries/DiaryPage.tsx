import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ChecklistCategoryDto, EntryDto, PhotoDto } from '@/api/entries';
import { useDaySchedules } from '@/api/schedules';
import { SafeImage } from '@/components/SafeImage';
import { colors, radius, spacing } from '@/theme';
import { checkedLabels, longKoreanDate, memoryLineOf } from './diary-page';

// 확정한 일기 한 쪽: 날짜 · 한 줄(제목) · 사진 · 본문 · 체크한 항목 · 기억 상태.
// 오늘의 일기(확정 후)와 일기 상세가 함께 쓴다. 종이 일기장처럼 조용하게
export function DiaryPage({
  date,
  entry,
  categories,
}: {
  date: string;
  entry: EntryDto;
  categories: ChecklistCategoryDto[];
}) {
  const note = entry.note?.trim();
  const checked = checkedLabels(categories, entry.checkedItemIds);
  const memory = memoryLineOf(entry.aiIndexStatus, entry.excludedFromMemory);

  return (
    <View style={styles.page} testID="diary-page">
      <Text style={styles.date}>{longKoreanDate(date)}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}

      {entry.photos.length > 0 ? <Photos photos={entry.photos} /> : null}

      <Text style={styles.body} selectable testID="entry-content">
        {entry.finalContent}
      </Text>

      {checked.length > 0 ? (
        <Text style={styles.checked}>{checked.join(' · ')}</Text>
      ) : null}

      {memory ? (
        <View style={styles.footer} testID="memory-line">
          {memory.busy ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : null}
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
  page: {
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg - 2,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  date: { fontSize: 13, color: colors.textMuted, letterSpacing: 0.2 },
  note: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: -spacing.xs,
  },
  photos: { gap: spacing.sm },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  thumbs: { flexDirection: 'row', gap: spacing.sm },
  thumbWrap: {
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  thumbOn: { borderColor: colors.text, opacity: 1 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm - 2 },
  body: { fontSize: 16.5, lineHeight: 29, color: colors.text },
  checked: { fontSize: 14, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: 13, color: colors.textMuted },
  failed: { color: colors.danger },
  schedules: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  schedulesLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  scheduleRow: { flexDirection: 'row', gap: spacing.sm + 4 },
  scheduleTime: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  scheduleTitle: { flex: 1, fontSize: 15, color: colors.text },
  scheduleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
