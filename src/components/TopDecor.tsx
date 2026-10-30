import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { warm } from '@/theme';

type Decor = {
  source: ImageSourcePropType;
  // 그림 비율 (가로 / 세로)
  aspectRatio: number;
};

// 시안의 위쪽 동심원은 화면 맨 위(제목 줄 뒤)부터 그려진다.
// 제목 줄이 있는 화면은 같은 그림을 두 군데에 같은 위치로 깐다:
//   1) 제목 줄 배경(HeaderDecor) — 화면 맨 위부터
//   2) 본문(TopDecorFrame) — 제목 줄 높이만큼 위로 당겨서, 1과 이어지게
function DecorImage({ source, aspectRatio, top }: Decor & { top: number }) {
  return (
    // 웹은 Image의 aspectRatio를 무시해서 크기는 감싼 View가 정한다
    <View pointerEvents="none" style={[styles.box, { aspectRatio, top }]}>
      <Image source={source} style={styles.image} />
    </View>
  );
}

// 제목 줄 배경: Stack.Screen options={{ headerBackground: () => <HeaderDecor … /> }}
export function HeaderDecor(props: Decor) {
  return (
    <View style={styles.header}>
      <DecorImage {...props} top={0} />
    </View>
  );
}

// 본문 쪽 틀: 자기 위치(창 기준 y = 제목 줄 높이)를 재서 그만큼 위로 당긴 장식을 깔고 children을 그린다
export function TopDecorFrame({
  decor,
  style,
  children,
}: {
  decor: Decor;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [top, setTop] = useState(0);
  return (
    <View
      ref={ref}
      style={style}
      onLayout={() => ref.current?.measureInWindow((_x, y) => setTop(y))}
    >
      <DecorImage {...decor} top={-top} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: warm.background,
  },
  box: { position: 'absolute', left: 0, right: 0 },
  image: { width: '100%', height: '100%' },
});
