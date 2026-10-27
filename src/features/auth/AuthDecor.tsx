import { Image, StyleSheet, View } from 'react-native';

// 시안의 동심원 배경. 시안 프레임(가로 402) 기준 크기를 화면 너비 비율(%)과 가로세로 비율로 맞춰
// 위쪽 그림은 화면 위 왼쪽, 아래쪽 그림은 화면 아래 오른쪽에 붙인다 (시안에서 프레임 밖은 잘려 있다).
// 화면 크기를 직접 읽지 않아 웹 첫 렌더(서버 렌더)에서도 크기가 맞다
const FRAME_WIDTH = 402;

const DECOR = {
  // 시작 화면: 위·아래 모두 가로 전체
  start: {
    top: {
      source: require('../../../assets/images/decor/splash-top.png'),
      width: 402,
      height: 474,
    },
    bottom: {
      source: require('../../../assets/images/decor/splash-bottom.png'),
      width: 402,
      height: 466,
    },
  },
  // 로그인·회원가입: 왼쪽 위, 오른쪽 아래
  auth: {
    top: {
      source: require('../../../assets/images/decor/auth-top.png'),
      width: 372.5,
      height: 380.5,
    },
    bottom: {
      source: require('../../../assets/images/decor/auth-bottom.png'),
      width: 363,
      height: 353,
    },
  },
} as const;

const sizeOf = ({ width, height }: { width: number; height: number }) => ({
  width: `${(width / FRAME_WIDTH) * 100}%` as const,
  aspectRatio: width / height,
});

export function AuthDecor({ variant }: { variant: keyof typeof DECOR }) {
  const { top, bottom } = DECOR[variant];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 크기는 감싸는 View가 정하고 그림은 그 안을 채운다 (웹 Image는 aspectRatio를 직접 따르지 않는다) */}
      <View style={[styles.bottom, sizeOf(bottom)]}>
        <Image source={bottom.source} style={styles.fill} />
      </View>
      {/* 위쪽 그림을 나중에 그린다: 시작 화면은 두 그림이 가운데서 겹치고, 위쪽 그림만 바탕이 투명하다 */}
      <View style={[styles.top, sizeOf(top)]}>
        <Image source={top.source} style={styles.fill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0 },
  bottom: { position: 'absolute', bottom: 0, right: 0 },
  fill: { width: '100%', height: '100%' },
});
