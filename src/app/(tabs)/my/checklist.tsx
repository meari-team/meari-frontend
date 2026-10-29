import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChecklist } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { OutlineButton } from '@/features/my/components';
import { CATEGORIES_MAX } from '@/features/my/logic';
import { fonts, warm } from '@/theme';

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
    <Screen edges={[]} backgroundColor={warm.background}>
      <Text style={styles.intro}>
        오늘의 일기에서 고르는 항목이에요. 고른 항목은 AI가 일기를 쓸 때
        참고해요.
      </Text>
      {categories.length === 0 ? (
        <Text style={styles.empty}>
          카테고리가 없어요. 오늘의 일기에서 고를 항목을 만들어 보세요.
        </Text>
      ) : (
        <View style={styles.list}>
          {categories.map((c, i) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name} 편집`}
              onPress={() =>
                router.push({ pathname: '/my/category', params: { id: c.id } })
              }
              style={({ pressed }) => [
                styles.row,
                i < categories.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
              testID={`category-${c.name}`}
            >
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  {/* 카테고리 색은 이름 앞 작은 점으로만 */}
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.count}>{c.items.length}개</Text>
                </View>
                <Text style={styles.items} numberOfLines={1}>
                  {c.items.map((item) => item.label).join(' · ') || '항목 없음'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={warm.tan} />
            </Pressable>
          ))}
        </View>
      )}
      <OutlineButton
        title="+ 카테고리 추가"
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
  intro: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: warm.brown,
  },
  // 홈과 같은 종이 카드
  list: {
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 61,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: warm.sand },
  pressed: { opacity: 0.6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  count: { fontFamily: fonts.medium, fontSize: 13, color: warm.tan },
  items: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: warm.brown,
    marginTop: 4,
    marginLeft: 16,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: warm.tan,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
  },
});
