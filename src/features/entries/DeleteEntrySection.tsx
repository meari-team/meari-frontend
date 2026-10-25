import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirming(true)}
          hitSlop={8}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          testID="delete-entry"
        >
          <Text style={styles.linkText}>이 일기 지우기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { marginTop: spacing.lg },
  // 평소엔 눈에 덜 띄게: 맨 아래 작은 회색 링크
  link: { alignSelf: 'center', paddingVertical: spacing.sm },
  linkText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.6 },
  error: { color: colors.danger, fontSize: 14 },
});
