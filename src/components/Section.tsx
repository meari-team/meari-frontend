import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, warm } from '@/theme';

type Props = {
  title?: string;
  hint?: string;
  // 제목 오른쪽 링크 (예: "전체 보기")
  action?: { label: string; onPress: () => void; testID?: string };
  children: ReactNode;
};

// 제목이 있는 카드 묶음 (홈과 같은 종이 카드)
export function Section({ title, hint, action, children }: Props) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          </View>
          {action ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={action.onPress}
              testID={action.testID}
            >
              <Text style={styles.action}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 20,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  header: { flex: 1, gap: 6 },
  action: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  hint: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
});
