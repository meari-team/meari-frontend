import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/api/checklist';
import { useChecklist, type ChecklistCategoryDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StateView } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import {
  CATEGORY_COLORS,
  CATEGORY_NAME_MAX,
  ITEMS_MAX,
  ITEM_LABEL_MAX,
  isValidCategory,
  removedItems,
  toCreateBody,
  toUpdateBody,
  validateCategory,
  type CategoryDraft,
  type DraftItem,
} from '@/features/my/logic';
import { colors, radius, spacing } from '@/theme';

let seq = 0;
const newKey = () => `new-${Date.now()}-${seq++}`;

// 카테고리 추가(id 없음)·수정(id 있음)
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const checklist = useChecklist();

  if (!id) {
    return (
      <>
        <Stack.Screen options={{ title: '카테고리 추가' }} />
        <CategoryForm />
      </>
    );
  }
  if (checklist.isPending) return <StateView status="loading" />;
  if (checklist.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(checklist.error)}
        onRetry={() => void checklist.refetch()}
      />
    );
  }
  const category = checklist.data.find((c) => c.id === id);
  if (!category) {
    return (
      <StateView
        status="empty"
        message="카테고리를 찾을 수 없어요. 이미 지워졌을 수 있어요."
        actionLabel="목록으로"
        onAction={() => router.back()}
      />
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: '카테고리 수정' }} />
      <CategoryForm category={category} />
    </>
  );
}

function CategoryForm({ category }: { category?: ChecklistCategoryDto }) {
  const editing = !!category;
  const [draft, setDraft] = useState<CategoryDraft>(() =>
    category
      ? {
          name: category.name,
          color: category.color.toUpperCase(),
          items: category.items.map((i) => ({
            key: i.id,
            id: i.id,
            label: i.label,
          })),
        }
      : {
          name: '',
          color: CATEGORY_COLORS[0],
          items: [{ key: newKey(), label: '' }],
        },
  );
  const [touched, setTouched] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const create = useCreateCategory();
  const update = useUpdateCategory(category?.id ?? '');
  const remove = useDeleteCategory(category?.id ?? '');
  const saving = create.isPending || update.isPending;
  const saveError = create.error ?? update.error;

  const errors = validateCategory(draft);
  const valid = isValidCategory(errors);
  const removed = category ? removedItems(category.items, draft) : [];

  const setItem = (key: string, patch: Partial<DraftItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    }));
  const removeItem = (key: string) =>
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.key !== key) }));
  const addItem = () =>
    setDraft((d) => ({
      ...d,
      items: [...d.items, { key: newKey(), label: '' }],
    }));

  const save = () => {
    setTouched(true);
    if (!valid) return;
    // 기존 항목을 지우면 그 항목의 지난 체크 기록도 사라진다 → 한 번 더 묻는다
    if (editing && removed.length > 0 && !confirmingSave) {
      setConfirmingSave(true);
      return;
    }
    const done = { onSuccess: () => router.back() };
    if (category) update.mutate(toUpdateBody(draft), done);
    else create.mutate(toCreateBody(draft), done);
  };

  return (
    <Screen edges={[]}>
      <Section title="이름과 색">
        <TextField
          label="이름"
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          maxLength={CATEGORY_NAME_MAX}
          placeholder="예: 운동"
          returnKeyType="done"
          error={touched ? errors.name : null}
          testID="category-name"
        />
        <View style={styles.colors} accessibilityRole="radiogroup">
          {CATEGORY_COLORS.map((color) => {
            const selected = draft.color === color;
            return (
              <Pressable
                key={color}
                accessibilityRole="radio"
                accessibilityLabel={`색 ${color}`}
                accessibilityState={{ selected }}
                onPress={() => setDraft((d) => ({ ...d, color }))}
                style={[styles.swatchRing, selected && styles.swatchSelected]}
                testID={`color-${color}`}
              >
                <View style={[styles.swatch, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section
        title="항목"
        hint={`최대 ${ITEMS_MAX}개, 각 ${ITEM_LABEL_MAX}자까지. 빈 칸은 저장하지 않아요.`}
      >
        {draft.items.map((item, index) => (
          <View key={item.key} style={styles.itemRow}>
            <View style={styles.flex}>
              <TextField
                label={`항목 ${index + 1}`}
                value={item.label}
                onChangeText={(label) => setItem(item.key, { label })}
                placeholder="예: 걷기"
                returnKeyType="done"
                error={
                  touched && errors.itemKeys.includes(item.key)
                    ? `${ITEM_LABEL_MAX}자까지예요.`
                    : null
                }
                testID={`item-${index}`}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`항목 ${index + 1} 삭제`}
              hitSlop={6}
              onPress={() => removeItem(item.key)}
              style={({ pressed }) => [
                styles.itemDelete,
                pressed && styles.pressed,
              ]}
              testID={`item-delete-${index}`}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: draft.items.length >= ITEMS_MAX }}
          disabled={draft.items.length >= ITEMS_MAX}
          onPress={addItem}
          style={({ pressed }) => [
            styles.addItem,
            draft.items.length >= ITEMS_MAX && styles.disabled,
            pressed && styles.pressed,
          ]}
          testID="item-add"
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addItemText}>
            항목 추가 ({draft.items.length}/{ITEMS_MAX})
          </Text>
        </Pressable>
        {touched && errors.items ? (
          <Text style={styles.error}>{errors.items}</Text>
        ) : null}
      </Section>

      {confirmingSave ? (
        <Section
          title="저장하면 지워지는 항목이 있어요"
          hint={`${removed.join(', ')} — 이 항목의 지난 체크 기록도 함께 지워지고 되돌릴 수 없어요.`}
        >
          <Button
            title="지우고 저장"
            variant="danger"
            loading={saving}
            onPress={save}
            testID="confirm-save"
          />
          <Button
            title="취소"
            variant="ghost"
            disabled={saving}
            onPress={() => setConfirmingSave(false)}
          />
        </Section>
      ) : (
        <Button
          title={editing ? '저장' : '추가'}
          loading={saving}
          disabled={touched && !valid}
          onPress={save}
          testID="category-save"
        />
      )}
      {saveError ? (
        <Text style={styles.error}>{errorMessage(saveError)}</Text>
      ) : null}

      {category ? (
        <View style={styles.deleteArea}>
          {confirmingDelete ? (
            <Section
              title={`'${category.name}' 카테고리를 지울까요?`}
              hint="항목과 지난 일기에 남은 이 카테고리의 체크가 모두 지워지고, 되돌릴 수 없어요."
            >
              <Button
                title="삭제"
                variant="danger"
                loading={remove.isPending}
                onPress={() =>
                  remove.mutate(undefined, { onSuccess: () => router.back() })
                }
                testID="confirm-delete-category"
              />
              <Button
                title="취소"
                variant="ghost"
                disabled={remove.isPending}
                onPress={() => {
                  setConfirmingDelete(false);
                  remove.reset();
                }}
              />
              {remove.isError ? (
                <Text style={styles.error}>{errorMessage(remove.error)}</Text>
              ) : null}
            </Section>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmingDelete(true)}
              style={({ pressed }) => [
                styles.deleteLink,
                pressed && styles.pressed,
              ]}
              testID="delete-category"
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.deleteText}>이 카테고리 삭제</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatchRing: {
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: colors.text },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  itemDelete: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addItemText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: colors.danger },
  error: { color: colors.danger, fontSize: 14 },
  deleteArea: { marginTop: spacing.lg },
});
