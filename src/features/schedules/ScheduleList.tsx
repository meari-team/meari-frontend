import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, errorMessage } from '@/api/errors';
import {
  schedulesKey,
  useCreateSchedule,
  useDaySchedules,
  useDeleteSchedule,
  useUpdateSchedule,
  type ScheduleDto,
} from '@/api/schedules';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { AuthButton } from '@/features/auth/AuthButton';
import { AuthField } from '@/features/auth/AuthField';
import {
  normalizeTime,
  SCHEDULE_TITLE_MAX,
  SCHEDULES_PER_DAY_MAX,
  validateTitle,
} from '@/lib/schedule';
import { colors, fonts, radius, spacing, warm } from '@/theme';

type Props = {
  date: string;
  editable?: boolean;
  title?: string;
  hint?: string;
  // 일정이 없을 때 문구. null이면 일정이 없으면 아무것도 그리지 않는다
  emptyText?: string | null;
};

// 그날 일정. editable이면 추가·수정·삭제 (캘린더), 아니면 읽기 전용 (오늘의 일기·일기 상세)
export function ScheduleList({
  date,
  editable = false,
  title = '일정',
  hint,
  emptyText = '등록한 일정이 없어요.',
}: Props) {
  const list = useDaySchedules(date);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (list.isPending) {
    return (
      <Section title={title} hint={hint}>
        <ActivityIndicator color={colors.primary} />
      </Section>
    );
  }
  if (list.isError) {
    return (
      <Section title={title} hint={hint}>
        <Text style={styles.error}>{errorMessage(list.error)}</Text>
        <Button
          title="다시 불러오기"
          variant="ghost"
          onPress={() => void list.refetch()}
        />
      </Section>
    );
  }

  const items = list.data;
  if (items.length === 0 && !editable && emptyText === null) return null;

  return (
    <Section title={title} hint={hint}>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyText ?? '등록한 일정이 없어요.'}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((s) =>
            editable && editingId === s.id ? (
              <ScheduleForm
                key={s.id}
                date={date}
                initial={s}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <ScheduleRow
                key={s.id}
                schedule={s}
                editable={editable}
                onEdit={() => setEditingId(s.id)}
              />
            ),
          )}
        </View>
      )}

      {editable && editingId === null ? (
        items.length >= SCHEDULES_PER_DAY_MAX ? (
          <Text style={styles.hint}>
            하루에 일정은 {SCHEDULES_PER_DAY_MAX}개까지 등록할 수 있어요.
          </Text>
        ) : (
          <ScheduleForm date={date} />
        )
      ) : null}
    </Section>
  );
}

function ScheduleRow({
  schedule,
  editable,
  onEdit,
}: {
  schedule: ScheduleDto;
  editable: boolean;
  onEdit: () => void;
}) {
  const client = useQueryClient();
  const remove = useDeleteSchedule();
  const del = () =>
    remove.mutate(schedule.id, {
      // 이미 지워진 일정이면 목록만 다시 읽는다
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'SCHEDULE_NOT_FOUND')
          void client.invalidateQueries({ queryKey: schedulesKey });
      },
    });

  return (
    <View style={styles.rowWrap}>
      <View style={styles.row} testID={`schedule-${schedule.id}`}>
        {schedule.time ? (
          <Text style={styles.time}>{schedule.time}</Text>
        ) : null}
        <Text
          style={[styles.title, schedule.completed && styles.titleDone]}
          numberOfLines={2}
        >
          {schedule.title}
        </Text>
        {editable ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${schedule.title} 수정`}
              hitSlop={8}
              onPress={onEdit}
              disabled={remove.isPending}
            >
              <Ionicons name="pencil" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${schedule.title} 삭제`}
              hitSlop={8}
              onPress={del}
              disabled={remove.isPending}
              testID={`schedule-delete-${schedule.id}`}
            >
              {remove.isPending ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
      {remove.isError ? (
        <Text style={styles.error}>{errorMessage(remove.error)}</Text>
      ) : null}
    </View>
  );
}

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
  list: { gap: spacing.xs },
  rowWrap: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  time: {
    minWidth: 44,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  title: { flex: 1, fontSize: 15, color: colors.text },
  titleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  actions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  empty: { fontSize: 14, color: colors.textMuted },
  hint: { fontSize: 13, color: colors.textMuted },
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
