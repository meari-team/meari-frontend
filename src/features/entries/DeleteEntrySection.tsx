import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

// 일기 삭제. 맨 아래 작은 링크 → 가운데 확인 창(취소 / 삭제). 일기 상세와 오늘의 일기에서 함께 쓴다
export function DeleteEntrySection({
  date,
  onDeleted,
}: {
  date: string;
  onDeleted?: () => void;
}) {
  const remove = useDeleteEntry(date);
  const [confirming, setConfirming] = useState(false);
  // 지우는 중에는 창을 닫지 않는다
  const close = () => {
    if (remove.isPending) return;
    setConfirming(false);
    remove.reset();
  };

  return (
    <View style={styles.area}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirming(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        testID="delete-entry"
      >
        <Text style={styles.linkText}>이 일기 지우기</Text>
      </Pressable>

      <Modal
        visible={confirming}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          {/* 바깥을 누르면 닫힌다. 창과 겹치지 않는 형제로 둬서 버튼 안에 버튼이 들어가지 않게 */}
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="닫기"
            onPress={close}
          />
          <View style={styles.dialog}>
            <Text style={styles.title}>이 일기를 지울까요?</Text>
            <Text style={styles.hint}>
              사진과 과거의 나의 기억에서도 함께 지워지고,{'\n'}되돌릴 수
              없어요.
            </Text>
            {remove.isError ? (
              <Text style={styles.error}>
                {deleteFailMessage(remove.error)}
              </Text>
            ) : null}
            <View style={styles.buttons}>
              <Pressable
                accessibilityRole="button"
                disabled={remove.isPending}
                onPress={close}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancel,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
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
                style={({ pressed }) => [
                  styles.button,
                  styles.delete,
                  pressed && styles.pressed,
                ]}
                testID="confirm-delete"
              >
                {remove.isPending ? (
                  <ActivityIndicator color={warm.field} />
                ) : (
                  <Text style={styles.deleteText}>삭제</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 36,
    backgroundColor: 'rgba(74,52,42,0.35)',
  },
  dialog: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderRadius: 16,
    backgroundColor: warm.field,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: warm.black },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.tan,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { borderWidth: 1.5, borderColor: warm.sand },
  cancelText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.brown },
  delete: { backgroundColor: warm.sunday },
  deleteText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.field },
});
