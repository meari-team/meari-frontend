import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { warm } from '@/theme';
import { AuthDecor } from './AuthDecor';

// 로그인·회원가입 화면 틀: 웜톤 바탕 + 동심원 배경 + 가운데 300 너비 열.
// topRatio: 시안 프레임(높이 874)에서 첫 요소가 시작하는 높이 비율
export function AuthScreen({
  children,
  topRatio,
}: {
  children: ReactNode;
  topRatio: number;
}) {
  const { height } = useWindowDimensions();
  return (
    <View style={styles.root}>
      <AuthDecor variant="auth" />
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <KeyboardAvoider>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingTop: Math.round(height * topRatio) },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.column}>{children}</View>
          </ScrollView>
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: warm.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  column: { width: '100%', maxWidth: 300 },
});
