import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChecklist } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { CATEGORIES_MAX } from '@/features/my/logic';
import { colors, radius, spacing } from '@/theme';

// 체크리스트 카테고리 목록 → 누르면 편집, 아래에서 추가
export default function ChecklistScreen() {
  const checklist = useChecklist();

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

  const categories = checklist.data;
  const full = categories.length >= CATEGORIES_MAX;

  return (
    <Screen edges={[]}>
      {categories.length === 0 ? (
        <Text style={styles.empty}>
          카테고리가 없어요. 오늘의 일기에서 고를 항목을 만들어 보세요.
        </Text>
      ) : (
        <View style={styles.list}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name} 편집`}
              onPress={() =>
                router.push({ pathname: '/my/category', params: { id: c.id } })
              }
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              testID={`category-${c.name}`}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <View style={styles.flex}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.items} numberOfLines={1}>
                  {c.items.map((i) => i.label).join(' · ') || '항목 없음'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
      )}
      <Button
        title="카테고리 추가"
        disabled={full}
        onPress={() => router.push('/my/category')}
        testID="add-category"
      />
      {full ? (
        <Text style={styles.hint}>
          카테고리는 {CATEGORIES_MAX}개까지 만들 수 있어요.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  items: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
