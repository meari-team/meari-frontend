import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, type ColorValue } from 'react-native';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type IconProps = { color: ColorValue; size: number };

function TabIcon({ name, color, size }: IconProps & { name: IconName }) {
  return <Ionicons name={name} color={color as string} size={size} />;
}

const icon = (name: IconName) => {
  const render = (props: IconProps) => <TabIcon name={name} {...props} />;
  return render;
};

// 하단 탭 5개: 홈 / 오늘의 일기 / 캘린더 / 과거의 나 / 마이페이지 (홈은 기획안 이후 추가)
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // 안드로이드에서 키보드가 올라올 때 탭바가 키보드 위로 따라 올라와 입력칸을 가리지 않게
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: '홈', tabBarIcon: icon('home-outline') }}
      />
      <Tabs.Screen
        name="today"
        options={{ title: '오늘의 일기', tabBarIcon: icon('create-outline') }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: '캘린더', tabBarIcon: icon('calendar-outline') }}
      />
      <Tabs.Screen
        name="past-self"
        options={{
          title: '과거의 나',
          tabBarIcon: icon('chatbubbles-outline'),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: '마이페이지', tabBarIcon: icon('person-outline') }}
      />
    </Tabs>
  );
}
