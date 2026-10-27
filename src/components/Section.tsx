import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Props = {
  title?: string;
  hint?: string;
  // 제목 오른쪽 링크 (예: "전체 보기")
  action?: { label: string; onPress: () => void; testID?: string };
  children: ReactNode;
};

// 제목이 있는 카드 묶음
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
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  header: { flex: 1, gap: 2 },
  action: { fontSize: 14, fontWeight: '600', color: colors.primary },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted },
});
