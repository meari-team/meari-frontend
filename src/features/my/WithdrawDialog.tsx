import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import { useWithdraw } from '@/api/profile';
import { colors, fonts, warm } from '@/theme';

const LOSSES = [
  '모든 일기와 사진',
  '과거의 나와 나눈 대화',
  'AI가 기억하고 있는 내 기록',
  '일정·체크리스트와 프로필',
];

// 서버가 AI 기억을 먼저 지우고, 하나라도 실패하면 아무것도 지우지 않는다 (503)
const withdrawFailMessage = (e: unknown) =>
  e instanceof ApiError && e.code === 'AI_INDEX_UNAVAILABLE'
    ? '기억 저장소에 연결할 수 없어 탈퇴하지 못했어요. 아무것도 지워지지 않았어요. 잠시 후 다시 시도해 주세요.'
    : errorMessage(e);

// 회원 탈퇴 확인 창 (가운데). 탈퇴하면 로그아웃되어 로그인 화면으로 간다
export function WithdrawDialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const withdraw = useWithdraw();
  // 지우는 중에는 창을 닫지 않는다
  const close = () => {
    if (withdraw.isPending) return;
    withdraw.reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
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
        <View style={styles.dialog} testID="withdraw-dialog">
          <Text style={styles.title}>정말 탈퇴할까요?</Text>
          <Text style={styles.hint}>
            탈퇴하면 아래 기록이 모두 지워지고 되돌릴 수 없어요.{'\n'}잠시 쉬고
            싶다면 로그아웃만 해도 돼요.
          </Text>
          <View style={styles.list}>
            {LOSSES.map((label) => (
              <View key={label} style={styles.item}>
                <Text style={styles.bullet}>·</Text>
                <Text style={styles.itemText}>{label}</Text>
              </View>
            ))}
          </View>
          {withdraw.isError ? (
            <Text style={styles.error} testID="withdraw-error">
              {withdrawFailMessage(withdraw.error)}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              disabled={withdraw.isPending}
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
              accessibilityState={{ disabled: withdraw.isPending }}
              disabled={withdraw.isPending}
              onPress={() => withdraw.mutate()}
              style={({ pressed }) => [
                styles.button,
                styles.confirm,
                pressed && styles.pressed,
              ]}
              testID="withdraw-confirm"
            >
              {withdraw.isPending ? (
                <ActivityIndicator color={warm.field} />
              ) : (
                <Text style={styles.confirmText}>탈퇴하기</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(74,52,42,0.35)',
  },
  dialog: {
    gap: 12,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderRadius: 16,
    backgroundColor: warm.field,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: warm.black,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.tan,
    textAlign: 'center',
  },
  // 지워지는 것: 바탕색 종이 조각
  list: {
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: warm.background,
  },
  item: { flexDirection: 'row', gap: 6 },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 21,
    color: warm.sunday,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: warm.ink,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { borderWidth: 1.5, borderColor: warm.sand },
  cancelText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.brown },
  confirm: { backgroundColor: warm.sunday },
  confirmText: { fontFamily: fonts.semibold, fontSize: 15, color: warm.field },
  pressed: { opacity: 0.7 },
});
