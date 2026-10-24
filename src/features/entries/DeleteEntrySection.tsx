import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDeleteEntry } from '@/api/entries';
import { ApiError, errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { colors, spacing } from '@/theme';

// 삭제는 AI 기억을 먼저 지운다. AI가 안 되면 503이고 아무것도 지워지지 않는다
const deleteFailMessage = (e: unknown) =>
  e instanceof ApiError && e.code === 'AI_INDEX_UNAVAILABLE'
    ? '기억 저장소에 연결할 수 없어 지우지 못했어요. 잠시 후 다시 시도해 주세요.'
    : errorMessage(e);

// 일기 삭제(확인 단계 포함). 일기 상세와 오늘의 일기에서 함께 쓴다
export function DeleteEntrySection({
  date,
  onDeleted,
}: {
  date: string;
  onDeleted?: () => void;
}) {
  const remove = useDeleteEntry(date);
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.area}>
      {confirming ? (
        <Section
          title="이 일기를 지울까요?"
          hint="사진과 과거의 나의 기억에서도 함께 지워지고, 되돌릴 수 없어요."
        >
          <Button
            title="삭제"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  setConfirming(false);
                  onDeleted?.();
                },
              })
            }
            testID="confirm-delete"
          />
          <Button
            title="취소"
            variant="ghost"
            disabled={remove.isPending}
            onPress={() => {
              setConfirming(false);
              remove.reset();
            }}
          />
          {remove.isError ? (
            <Text style={styles.error}>{deleteFailMessage(remove.error)}</Text>
          ) : null}
        </Section>
      ) : (
        <Button
          title="일기 삭제"
          variant="ghost"
          onPress={() => setConfirming(true)}
          testID="delete-entry"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: 14 },
});
