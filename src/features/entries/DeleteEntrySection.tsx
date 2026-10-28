import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDeleteEntry } from '@/api/entries';
import { ApiError, errorMessage } from '@/api/errors';
import { colors, fonts, spacing, warm } from '@/theme';

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
        <View style={styles.confirm}>
          <Text style={styles.title}>이 일기를 지울까요?</Text>
          <Text style={styles.hint}>
            사진과 과거의 나의 기억에서도 함께 지워지고, 되돌릴 수 없어요.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: remove.isPending }}
            disabled={remove.isPending}
            onPress={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  setConfirming(false);
                  onDeleted?.();
                },
              })
            }
            style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
            testID="confirm-delete"
          >
            {remove.isPending ? (
              <ActivityIndicator color={warm.field} />
            ) : (
              <Text style={styles.deleteText}>삭제</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={remove.isPending}
            onPress={() => {
              setConfirming(false);
              remove.reset();
            }}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
          {remove.isError ? (
            <Text style={styles.error}>{deleteFailMessage(remove.error)}</Text>
          ) : null}
        </View>
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
  // 평소엔 눈에 덜 띄게: 맨 아래 작은 링크
  link: { alignSelf: 'center', paddingVertical: spacing.sm },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: warm.tan,
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.6 },
  confirm: {
    gap: 10,
    padding: 20,
    borderRadius: 10,
    backgroundColor: warm.field,
    borderWidth: 1,
    borderColor: warm.sand,
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: warm.black },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: warm.tan },
  delete: {
    height: 45,
    borderRadius: 26,
    marginTop: 4,
    backgroundColor: warm.sunday,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.field },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: warm.brown },
  error: { color: colors.danger, fontSize: 14 },
});
