import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// 키보드가 올라오면 그만큼 아래 여백을 줘서 내용(하단 버튼·입력창)을 키보드 위로 올린다.
// RN KeyboardAvoidingView는 자기 위치를 부모 기준으로만 알아서, 헤더·상태바가 위에 있으면
// 그 높이만큼 덜 올린다. 그래서 화면(window) 기준 위치를 재서 keyboardVerticalOffset으로 넘긴다.
// 아래 탭바·안전 영역은 이 뷰의 높이에 이미 빠져 있으므로 따로 계산하지 않는다.
// 안드로이드도 edge-to-edge라 창이 줄지 않으므로 iOS와 같은 padding 방식을 쓴다.
export function KeyboardAvoider({
  children,
  style,
  enabled = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [top, setTop] = useState(0);

  return (
    <View
      ref={ref}
      style={[styles.flex, style]}
      onLayout={() => ref.current?.measureInWindow((_x, y) => setTop(y))}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={top}
        enabled={enabled}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
