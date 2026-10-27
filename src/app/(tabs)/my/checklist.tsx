import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChecklist } from '@/api/entries';
import { errorMessage } from '@/api/errors';
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
      <Text style={styles.intro}>
        오늘의 일기에서 체크하는 항목이에요. 체크한 항목은 AI가 일기를 쓸 때
        참고해요.
      </Text>
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
              <View style={[styles.dot, { backgroundColor: `${c.color}26` }]}>
                <View style={[styles.dotInner, { backgroundColor: c.color }]} />
              </View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.count}>{c.items.length}개</Text>
                </View>
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: full }}
        disabled={full}
        onPress={() => router.push('/my/category')}
        style={({ pressed }) => [
          styles.add,
          full && styles.addDisabled,
          pressed && styles.pressed,
        ]}
        testID="add-category"
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={styles.addText}>카테고리 추가</Text>
      </Pressable>
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
  intro: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  list: {
    borderRadius: radius.md + 4,
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
  dot: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: { width: 12, height: 12, borderRadius: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  count: { fontSize: 12, color: colors.textMuted },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: radius.md + 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  addDisabled: { opacity: 0.4 },
  addText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  items: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
