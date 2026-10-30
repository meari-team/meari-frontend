import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import {
  useCreateSchedule,
  useUpdateSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { AuthButton } from '@/features/auth/AuthButton';
import { AuthField } from '@/features/auth/AuthField';
import {
  normalizeTime,
  SCHEDULE_TITLE_MAX,
  validateTitle,
} from '@/lib/schedule';
import { colors, fonts, warm } from '@/theme';

// 새 일정(initial 없음) 또는 수정(initial 있음). 캘린더의 일정 시트에서 쓴다 (웜톤 알약 입력칸·버튼)
export function ScheduleForm({
  date,
  initial,
  onDone,
  autoFocus,
}: {
  date: string;
  initial?: ScheduleDto;
  // 저장·추가가 끝나거나 취소하면 부른다
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [localError, setLocalError] = useState<string | null>(null);
  const create = useCreateSchedule();
  const update = useUpdateSchedule();
  const mutation = initial ? update : create;

  const submit = () => {
    const titleError = validateTitle(title);
    const normalized = normalizeTime(time);
    if (titleError) return setLocalError(titleError);
    if (normalized === undefined)
      return setLocalError(
        '시간은 14:30처럼 적어 주세요. 비워 두면 시간 없는 할 일이 돼요.',
      );
    setLocalError(null);
    const body = { title: title.trim(), time: normalized };
    if (initial) {
      update.mutate(
        { id: initial.id, ...body },
        { onSuccess: () => onDone?.() },
      );
    } else {
      create.mutate(
        { date, ...body },
        {
          onSuccess: () => {
            setTitle('');
            setTime('');
            onDone?.();
          },
        },
      );
    }
  };

  return (
    <View style={styles.form}>
      <AuthField
        value={title}
        onChangeText={setTitle}
        maxLength={SCHEDULE_TITLE_MAX}
        placeholder="일정 이름 (예: 동아리 회의)"
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={submit}
        testID={initial ? 'schedule-edit-title' : 'schedule-title'}
      />
      <AuthField
        value={time}
        onChangeText={setTime}
        placeholder="시간 (선택, 예: 14:30)"
        hint="시간을 비워 두면 체크하는 할 일이 돼요."
        keyboardType="numbers-and-punctuation"
        maxLength={8}
        returnKeyType="done"
        onSubmitEditing={submit}
        testID={initial ? 'schedule-edit-time' : 'schedule-time'}
      />
      {localError || mutation.isError ? (
        <Text style={styles.error}>
          {localError ?? errorMessage(mutation.error)}
        </Text>
      ) : null}
      <AuthButton
        title={initial ? '저장' : '추가'}
        onPress={submit}
        loading={mutation.isPending}
        disabled={title.trim().length === 0}
        testID={initial ? 'schedule-save' : 'schedule-add'}
      />
      {initial ? (
        <Pressable
          accessibilityRole="button"
          disabled={mutation.isPending}
          onPress={() => onDone?.()}
          style={({ pressed }) => [styles.textButton, pressed && styles.dim]}
        >
          <Text style={styles.textButtonLabel}>취소</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, color: colors.danger },
  form: { gap: 14 },
  textButton: { alignSelf: 'center', padding: 6 },
  textButtonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.brown,
  },
  dim: { opacity: 0.6 },
});
