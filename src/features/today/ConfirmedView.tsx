import { StyleSheet, View } from 'react-native';
import type { ChecklistCategoryDto, EntryDto } from '@/api/entries';
import { Button } from '@/components/Button';
import { DiaryPage } from '@/features/entries/DiaryPage';
import { spacing } from '@/theme';

type Props = {
  date: string;
  entry: EntryDto;
  categories: ChecklistCategoryDto[];
  onEdit: () => void;
};

// 확정된 일기 보기: 일기 한 쪽 + [수정하기]. 기억 상태는 일기 아래 작은 글씨
export function ConfirmedView({ date, entry, categories, onEdit }: Props) {
  return (
    <View style={styles.wrap}>
      <DiaryPage date={date} entry={entry} categories={categories} />
      <Button
        title="수정하기"
        variant="secondary"
        onPress={onEdit}
        testID="edit-entry"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
});
