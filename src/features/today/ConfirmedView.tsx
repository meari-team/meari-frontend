import { StyleSheet, Text, View } from 'react-native';
import type { ChecklistCategoryDto, EntryDto } from '@/api/entries';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { PhotoGrid } from '@/components/PhotoGrid';
import { MAX_PHOTOS } from '@/lib/image';
import { colors, spacing } from '@/theme';
import { indexBadgeOf } from './stage';

type Props = {
  entry: EntryDto;
  categories: ChecklistCategoryDto[];
  onEdit: () => void;
};

// 확정된 일기 보기. 기억 저장 상태 배지와 [수정]
export function ConfirmedView({ entry, categories, onEdit }: Props) {
  const badge = indexBadgeOf(entry.aiIndexStatus);
  const checked = new Set(entry.checkedItemIds);
  const items = categories.flatMap((c) =>
    c.items
      .filter((i) => checked.has(i.id))
      .map((i) => ({ ...i, color: c.color })),
  );

  return (
    <View style={styles.wrap}>
      {badge ? (
        <Badge
          label={badge.label}
          tone={badge.tone}
          spinning={badge.spinning}
        />
      ) : null}
      {entry.excludedFromMemory ? <Badge label="기억에서 제외됨" /> : null}

      {entry.photos.length > 0 ? (
        <PhotoGrid
          photos={entry.photos.map((p) => ({ key: p.id, uri: p.url }))}
          max={MAX_PHOTOS}
        />
      ) : null}

      <Text style={styles.content} selectable>
        {entry.finalContent}
      </Text>

      {items.length > 0 ? (
        <View style={styles.chips}>
          {items.map((i) => (
            <Chip key={i.id} label={i.label} color={i.color} />
          ))}
        </View>
      ) : null}

      <Button title="수정" variant="ghost" onPress={onEdit} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  content: { fontSize: 16, lineHeight: 26, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
