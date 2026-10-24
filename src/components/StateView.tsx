import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Button } from './Button';

type Props =
  | { status: 'loading'; message?: string }
  | { status: 'error'; message: string; onRetry?: () => void }
  | {
      status: 'empty';
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    };

// 화면 전체의 로딩·에러·빈 상태. 모든 화면은 이 세 상태를 그린다 (prd.md §8)
export function StateView(props: Props) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      {props.status === 'loading' ? (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          {props.message ? (
            <Text style={styles.message}>{props.message}</Text>
          ) : null}
        </>
      ) : null}
      {props.status === 'error' ? (
        <>
          <Text style={[styles.message, styles.error]}>{props.message}</Text>
          {props.onRetry ? (
            <Button title="다시 시도" variant="ghost" onPress={props.onRetry} />
          ) : null}
        </>
      ) : null}
      {props.status === 'empty' ? (
        <>
          <Text style={styles.message}>{props.message}</Text>
          {props.actionLabel && props.onAction ? (
            <Button title={props.actionLabel} onPress={props.onAction} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: { color: colors.danger },
});
