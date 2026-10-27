import { Tabs } from 'expo-router';
import {
  Image,
  Platform,
  type ColorValue,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, warm } from '@/theme';

type IconProps = { color: ColorValue };

const ICONS = {
  home: require('../../../assets/images/tabs/home.png'),
  today: require('../../../assets/images/tabs/today.png'),
  calendar: require('../../../assets/images/tabs/calendar.png'),
  pastSelf: require('../../../assets/images/tabs/past-self.png'),
  my: require('../../../assets/images/tabs/my.png'),
} satisfies Record<string, ImageSourcePropType>;

// 디자인 아이콘(Phosphor)을 PNG로 두고 탭 색으로 칠한다
const icon = (source: ImageSourcePropType) => {
  const render = ({ color }: IconProps) => (
    <Image
      source={source}
      style={{ width: 30, height: 30, tintColor: color as string }}
    />
  );
  return render;
};

// 하단 탭 5개: 홈 / 오늘의 일기 / 캘린더 / 과거의 나 / 마이페이지 (홈은 기획안 이후 추가)
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom - 14, 6);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: warm.ink,
        tabBarInactiveTintColor: warm.sand,
        tabBarStyle: {
          // 디자인은 홈 표시줄 영역 일부까지 라벨이 내려온다 (높이 80 = 내용 + 아래 여백)
          height: 64 + bottomGap,
          paddingTop: 8,
          paddingBottom: bottomGap,
          backgroundColor: warm.field,
          borderTopWidth: 0,
          shadowColor: warm.brown,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          elevation: 12,
        },
        tabBarIconStyle: { width: 30, height: 30 },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11,
          marginTop: 4,
        },
        // 안드로이드에서 키보드가 올라올 때 탭바가 키보드 위로 따라 올라와 입력칸을 가리지 않게
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: '홈', tabBarIcon: icon(ICONS.home) }}
      />
      <Tabs.Screen
        name="today"
        options={{ title: '오늘의 일기', tabBarIcon: icon(ICONS.today) }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: '캘린더', tabBarIcon: icon(ICONS.calendar) }}
      />
      <Tabs.Screen
        name="past-self"
        options={{ title: '과거의 나', tabBarIcon: icon(ICONS.pastSelf) }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: '마이페이지', tabBarIcon: icon(ICONS.my) }}
      />
    </Tabs>
  );
}
