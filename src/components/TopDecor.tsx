import { useState, type ReactNode } from 'react';
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

// 시안의 위쪽 동심원은 제목(가운데 굵은 글씨)을 기준으로 놓인다.
// 시안(아이폰, 상태바 62 + 제목 줄 44)에서 제목 가운데는 y=87, 그림 맨 위는 y=0 →
// 그림 맨 위 = 제목 줄 아래 끝 - TITLE_ANCHOR. 상태바가 없는 웹이나 다른 폰에서도 제목과의 간격이 같다.
// 제목 줄이 있는 화면은 같은 그림을 두 군데에 같은 위치로 깐다:
//   1) 제목 줄 배경(HeaderDecor) — 제목 줄 높이를 재서 그 기준으로
//   2) 본문(TopDecorFrame) — 본문 맨 위 = 제목 줄 아래 끝이라 늘 같은 자리
const TITLE_ANCHOR = 109;

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
  const [height, setHeight] = useState<number | null>(null);
  return (
    <View
      style={styles.header}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {height !== null ? (
        <DecorImage {...props} top={height - TITLE_ANCHOR} />
      ) : null}
    </View>
  );
}

// 본문 쪽 틀: 맨 위가 제목 줄 아래 끝이므로 그림을 TITLE_ANCHOR만큼 위로 당겨 깐다
export function TopDecorFrame({
  decor,
  style,
  children,
}: {
  decor: Decor;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[styles.frame, style]}>
      <DecorImage {...decor} top={-TITLE_ANCHOR} />
      {children}
    </View>
  );
}

// 잘리지 않은 동심원 한 벌 (시안 그림 735×735). 화면 맨 위에서 시작해 아래로 퍼져 내려온다.
// 화면보다 넓어서 가로는 가운데 맞춤 (좌우는 화면 밖으로 나간다)
const RINGS = require('../../assets/images/decor/rings-full.png');
const RINGS_SIZE = 735;
const BASE_WIDTH = 402;

export function FullRings() {
  return (
    <View pointerEvents="none" style={styles.rings}>
      <Image source={RINGS} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: warm.background,
  },
  // 위로 당긴 그림이 제목 줄 위로 넘치지 않게
  frame: { overflow: 'hidden' },
  box: { position: 'absolute', left: 0, right: 0 },
  rings: {
    position: 'absolute',
    top: 0,
    width: `${(RINGS_SIZE / BASE_WIDTH) * 100}%`,
    left: `${((BASE_WIDTH - RINGS_SIZE) / 2 / BASE_WIDTH) * 100}%`,
    aspectRatio: 1,
  },
  image: { width: '100%', height: '100%' },
});
