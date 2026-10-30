import type { ComponentRef, ReactNode, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { spacing, warm } from '@/theme';

const IOS = Platform.OS === 'ios';

// 화면 공통 틀: 안전 영역 + 키보드 대응 + 스크롤
// 헤더가 있는 화면(탭 안 Stack)은 edges={[]}로 위쪽 여백을 헤더에 맡긴다
// onRefresh를 주면 당겨서 새로고침
//
// 키보드: 입력칸을 누르면 키보드에 가리지 않게 스크롤되고, 빈 곳을 누르거나
// 아래로 끌면 키보드가 내려간다.
// - iOS: ScrollView가 키보드 높이만큼 아래 여백을 넣고 입력칸 위치로 스크롤한다
//   (automaticallyAdjustKeyboardInsets). 끌어서 내리는 interactive 방식.
// - Android: KeyboardAvoider로 화면을 키보드 위까지 줄인다. 스크롤하면 내려간다.
//
// footer: 스크롤 밖 아래에 고정되는 영역(예: [다음] 버튼). 키보드가 열리면 키보드 바로 위에 붙도록
// iOS도 KeyboardAvoider로 화면을 줄인다 (이때 ScrollView의 자동 여백은 끈다 — 두 번 밀리지 않게).
export function Screen({
  children,
  edges = ['top', 'bottom'],
  refreshing = false,
  onRefresh,
  footer,
  backgroundColor,
  footerStyle,
  scrollRef,
}: {
  children: ReactNode;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  // 웜톤 시안을 적용한 화면은 바탕색을 넘긴다
  backgroundColor?: string;
  // 아래 고정 영역 모양 바꾸기 (예: 웜톤 화면은 선·바탕 없이)
  footerStyle?: StyleProp<ViewStyle>;
  // 화면 스크롤을 직접 움직여야 할 때 (예: 연간 캘린더를 최근 달로)
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
}) {
  return (
    <SafeAreaView
      style={[styles.safe, backgroundColor ? { backgroundColor } : null]}
      edges={edges}
    >
      <KeyboardAvoider enabled={!IOS || !!footer}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={IOS ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={IOS && !footer}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={warm.tan}
                colors={[warm.tan]}
                progressBackgroundColor={warm.field}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, footerStyle]}>{footer}</View>
        ) : null}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 기본 바탕도 웜톤 (화면마다 backgroundColor로 바꿀 수 있다)
  safe: { flex: 1, backgroundColor: warm.background },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: warm.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: warm.sand,
  },
});
