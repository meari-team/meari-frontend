import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { warm } from '@/theme';

// 시안 "로딩" 아이콘: 아래에서 위로 퍼지는 고리 세 개 (메아리). 아래 고리부터 차례로 켜졌다가 함께 흐려진다.
// 꺼진 색 = 시안의 회색 고리, 켜진 색 = 아래부터 진갈색·갈색·황갈색 ("로딩 진행")
const ARCS = [
  { source: require('../../assets/images/loading/arc-1.png'), on: warm.ink },
  { source: require('../../assets/images/loading/arc-2.png'), on: warm.brown },
  { source: require('../../assets/images/loading/arc-3.png'), on: warm.tan },
];
const OFF = '#D6D2CA';
const CYCLE = 1800;

export function ArcLoader() {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: CYCLE,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <View
      style={styles.icon}
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
    >
      {ARCS.map((arc, i) => (
        <View key={i} style={StyleSheet.absoluteFill}>
          {/* 꺼진 고리 위에 켜진 고리를 겹쳐 두고 켜진 쪽 투명도만 움직인다 */}
          <Image
            source={arc.source}
            style={[styles.arc, { tintColor: i === 0 ? arc.on : OFF }]}
          />
          {i > 0 ? (
            <Animated.Image
              source={arc.source}
              style={[
                styles.arc,
                {
                  tintColor: arc.on,
                  opacity: t.interpolate({
                    inputRange: [0, i * 0.25, i * 0.25 + 0.12, 0.85, 1],
                    outputRange: [0, 0, 1, 1, 0],
                  }),
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 41, height: 37 },
  arc: { position: 'absolute', width: 41, height: 37 },
});
