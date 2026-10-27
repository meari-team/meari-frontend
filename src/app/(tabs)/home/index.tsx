import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '@/api/auth';
import { shortDate } from '@/features/home/logic';
import {
  PastSelfShortcuts,
  RecentEntries,
  TodayCard,
  TodaySchedules,
} from '@/features/home/sections';
import { todayKst } from '@/lib/dates';
import { fonts, warm } from '@/theme';

const topDecor = require('../../../../assets/images/decor/home-top.png');
const topFade = require('../../../../assets/images/home/top-fade.png');

// 디자인 기준(402×874)에서 날짜가 놓이는 높이. 안전 영역이 더 깊으면 그만큼 내린다
const HEADER_TOP = 74;
const FADE_DISTANCE = 120;

// 홈: 오늘 할 일과 지난 기록을 한눈에. 카드마다 따로 불러오고 따로 실패한다
export default function HomeScreen() {
  const today = todayKst();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(() => new Animated.Value(0));

  // 당겨서 새로고침: 홈에 떠 있는 쿼리를 모두 다시 읽는다
  const refresh = async () => {
    setRefreshing(true);
    try {
      await client.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  // 스크롤하면 위쪽에 갈색 그라디언트가 서서히 깔려 상태 표시줄 글자가 묻히지 않는다
  const fadeOpacity = scrollY.interpolate({
    inputRange: [0, FADE_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const name = me.data?.nickname;
  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(HEADER_TOP, insets.top + 12) },
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={warm.tan}
          />
        }
      >
        <View style={styles.decor} pointerEvents="none">
          <Image source={topDecor} style={styles.decorImage} />
        </View>
        <View style={styles.greeting}>
          <Text style={styles.date}>{shortDate(today)}</Text>
          <Text style={styles.hello} testID="home-greeting">
            {name ? `${name}님, ` : ''}오늘 하루는 어땠나요?
          </Text>
        </View>

        <TodayCard today={today} />
        <TodaySchedules today={today} />
        <PastSelfShortcuts />
        <RecentEntries />
      </Animated.ScrollView>
      <Animated.Image
        source={topFade}
        pointerEvents="none"
        style={[styles.fade, { opacity: fadeOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  content: { flexGrow: 1, gap: 18, paddingBottom: 32 },
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 402 / 254,
  },
  decorImage: { width: '100%', height: '100%' },
  greeting: { paddingHorizontal: 28, gap: 11, marginBottom: 35 },
  date: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: warm.brown,
  },
  hello: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: warm.black,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 131,
  },
});
