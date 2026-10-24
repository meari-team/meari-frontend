import { useQueryClient } from '@tanstack/react-query';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, errorMessage } from '@/api/errors';
import {
  schedulesKey,
  useDeleteSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { Button } from '@/components/Button';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { ScheduleForm } from '@/features/schedules/ScheduleList';
import { formatKoreanDate } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

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
            <Text style={styles.title}>{formatKoreanDate(date)}</Text>
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
      <Button
        title="일정 삭제"
        variant="ghost"
        testID="schedule-sheet-delete"
        loading={remove.isPending}
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
      />
      {remove.isError ? (
        <Text style={styles.error}>{errorMessage(remove.error)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.md * 2,
    borderTopRightRadius: radius.md * 2,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  delete: { gap: spacing.xs },
  error: { fontSize: 13, color: colors.danger, textAlign: 'center' },
});
