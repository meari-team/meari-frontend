import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMe } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { colors, radius, spacing } from '@/theme';

export default function MyScreen() {
  const me = useMe();
  const signOut = useAuth((s) => s.signOut);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {me.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : me.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{errorMessage(me.error)}</Text>
            <Button
              title="다시 시도"
              variant="ghost"
              onPress={() => me.refetch()}
            />
          </View>
        ) : (
          <>
            <Text style={styles.nickname}>{me.data.nickname}</Text>
            <Text style={styles.email}>{me.data.email}</Text>
          </>
        )}
      </View>
      <Button title="로그아웃" variant="ghost" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    minHeight: 88,
    justifyContent: 'center',
  },
  nickname: { fontSize: 20, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  errorBox: { gap: spacing.sm },
  error: { color: colors.danger },
});
