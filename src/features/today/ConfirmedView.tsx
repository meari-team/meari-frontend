import { StyleSheet, View } from 'react-native';
import type { ChecklistCategoryDto, EntryDto } from '@/api/entries';
import { DiaryPage } from '@/features/entries/DiaryPage';
import { OutlineButton } from '@/features/my/components';

type Props = {
  date: string;
  entry: EntryDto;
  categories: ChecklistCategoryDto[];
  onEdit: () => void;
};

// 확정된 일기 보기 (시안 "일기내용 저장후"): 일기 한 쪽 + [수정하기]. 기억 상태는 일기 아래 작은 글씨
export function ConfirmedView({ date, entry, categories, onEdit }: Props) {
  return (
    <View style={styles.wrap}>
      {/* 날짜는 위 머리말에 있어 일기 안에서는 뺀다 (시안) */}
      <DiaryPage
        date={date}
        entry={entry}
        categories={categories}
        showDate={false}
      />
      <OutlineButton title="수정하기" onPress={onEdit} testID="edit-entry" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
});
