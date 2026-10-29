import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { warm } from '@/theme';

const RINGS = 3;
const DURATION = 2100;

// 메아리 로딩: 가운데 점에서 고리가 차례로 퍼져 나가며 옅어진다 (앱 곳곳의 동심원 장식과 같은 모양)
export function EchoLoader({ size = 84 }: { size?: number }) {
  const [waves] = useState(() =>
    Array.from({ length: RINGS }, () => new Animated.Value(0)),
  );

  useEffect(() => {
    const loops = waves.map((wave, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((DURATION / RINGS) * i),
          Animated.timing(wave, {
            toValue: 1,
            duration: DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // 다음 바퀴를 같은 간격으로 시작하도록 나머지 시간을 채운다
          Animated.delay((DURATION / RINGS) * (RINGS - 1 - i)),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [waves]);

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
    >
      {waves.map((wave, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              borderRadius: size / 2,
              opacity: wave.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, 0.9, 0],
              }),
              transform: [
                {
                  scale: wave.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.dot,
          {
            width: size / 6,
            height: size / 6,
            borderRadius: size / 12,
            top: size / 2 - size / 12,
            left: size / 2 - size / 12,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: warm.tan,
    backgroundColor: 'rgba(215,201,184,0.25)',
  },
  dot: { position: 'absolute', backgroundColor: warm.brown },
});
