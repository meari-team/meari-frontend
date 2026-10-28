import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import {
  schedulesKey,
  useDeleteSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { ScheduleForm } from '@/features/schedules/ScheduleList';
import { formatKoreanDate } from '@/lib/dates';
import { colors, fonts, radius, spacing, warm } from '@/theme';

type Props = {
  // 열려 있으면 그 날짜. editing이 있으면 수정, 없으면 추가
  date: string | null;
  editing?: ScheduleDto | null;
  onClose: () => void;
};

// 캘린더의 + 버튼·일정 누르기로 여는 아래 시트. 키보드가 올라오면 시트도 같이 올라간다
export function ScheduleSheet({ date, editing, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={date !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoider>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onClose}
        />
        {date ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: spacing.lg + insets.bottom },
            ]}
            testID="schedule-sheet"
          >
            <View style={styles.handle} />
            <Text style={styles.title}>
              {formatKoreanDate(date)} · {editing ? '일정 수정' : '일정 추가'}
            </Text>
            <ScheduleForm
              key={editing?.id ?? 'new'}
              date={date}
              initial={editing ?? undefined}
              onDone={onClose}
              autoFocus
            />
            {editing ? (
              <DeleteButton schedule={editing} onDeleted={onClose} />
            ) : null}
          </View>
        ) : null}
      </KeyboardAvoider>
    </Modal>
  );
}

function DeleteButton({
  schedule,
  onDeleted,
}: {
  schedule: ScheduleDto;
  onDeleted: () => void;
}) {
  const client = useQueryClient();
  const remove = useDeleteSchedule();
  return (
    <View style={styles.delete}>
      <Pressable
        accessibilityRole="button"
        testID="schedule-sheet-delete"
        disabled={remove.isPending}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.dim]}
        onPress={() =>
          remove.mutate(schedule.id, {
            onSuccess: onDeleted,
            // 이미 지워진 일정이면 목록만 다시 읽고 닫는다
            onError: (e) => {
              if (e instanceof ApiError && e.code === 'SCHEDULE_NOT_FOUND') {
                void client.invalidateQueries({ queryKey: schedulesKey });
                onDeleted();
              }
            },
          })
        }
      >
        {remove.isPending ? (
          <ActivityIndicator color={warm.sunday} />
        ) : (
          <Text style={styles.deleteText}>일정 삭제</Text>
        )}
      </Pressable>
      {remove.isError ? (
        <Text style={styles.error}>{errorMessage(remove.error)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(74,52,42,0.3)' },
  sheet: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.md * 2,
    borderTopRightRadius: radius.md * 2,
    backgroundColor: warm.background,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: warm.sand,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: warm.black },
  delete: { gap: spacing.xs },
  deleteButton: { alignSelf: 'center', padding: 6 },
  deleteText: { fontFamily: fonts.semibold, fontSize: 14, color: warm.sunday },
  dim: { opacity: 0.6 },
  error: { fontSize: 13, color: colors.danger, textAlign: 'center' },
});
