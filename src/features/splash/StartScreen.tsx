import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AuthDecor } from '@/features/auth/AuthDecor';
import { splashDone } from '@/lib/splash';
import { fonts, warm } from '@/theme';

const logo = require('../../../assets/images/brand/logo.png');

// 시안 "로딩 화면" (Figma 1:2): 동심원 배경 + 로고 + 한 줄.
// 앱을 처음 켤 때만 보이고, 토큰 확인(authReady)이 끝나고 1.5초가 지나면 onDone
export function StartScreen({
  authReady,
  onDone,
}: {
  authReady: boolean;
  onDone: () => void;
}) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const done = splashDone(elapsed, authReady);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  return (
    <View style={styles.wrap} testID="start-screen">
      <AuthDecor variant="start" />
      <View style={styles.brand}>
        <Image
          source={logo}
          style={styles.logo}
          accessibilityRole="header"
          accessibilityLabel="메아리"
        />
        <Text style={styles.tagline}>사진 몇 장으로 남기는 오늘</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: warm.background, justifyContent: 'center' },
  // 시안: 로고·한 줄 묶음의 가운데가 화면 가운데보다 62 위
  brand: { alignItems: 'center', transform: [{ translateY: -62 }] },
  // 로고: 메(진갈)·아(갈)·리(황갈) 세 글자 (시안 벡터를 PNG로)
  logo: { width: 249, height: 98 },
  // 시안: 아래 동심원 위에 흰 글씨
  tagline: {
    marginTop: 24,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
