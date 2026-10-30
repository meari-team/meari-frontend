import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, warm } from '@/theme';
import { ArcLoader } from './ArcLoader';

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
// 웜톤: 로딩은 시안의 메아리 아이콘(고리 세 개), 다시 시도는 테두리 알약, 빈 상태 동작은 황갈색 알약
export function StateView(props: Props) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      {props.status === 'loading' ? (
        <>
          <ArcLoader />
          {props.message ? (
            <Text style={styles.message}>{props.message}</Text>
          ) : null}
        </>
      ) : null}
      {props.status === 'error' ? (
        <>
          <Text style={[styles.message, styles.error]}>{props.message}</Text>
          {props.onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={props.onRetry}
              style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {props.status === 'empty' ? (
        <>
          <Text style={styles.message}>{props.message}</Text>
          {props.actionLabel && props.onAction ? (
            <Pressable
              accessibilityRole="button"
              onPress={props.onAction}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionText}>{props.actionLabel}</Text>
            </Pressable>
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
    gap: 16,
    padding: 24,
    backgroundColor: warm.background,
  },
  message: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: warm.brown,
    textAlign: 'center',
  },
  error: { color: warm.sunday },
  retry: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontFamily: fonts.semibold, fontSize: 14, color: warm.brown },
  action: {
    height: 45,
    paddingHorizontal: 32,
    borderRadius: 26,
    backgroundColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.field },
  pressed: { opacity: 0.7 },
});
