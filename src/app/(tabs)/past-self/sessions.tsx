import { useState } from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { useChatSessions } from '@/api/past-self';
import { Screen } from '@/components/Screen';
import { HeaderDecor, TopDecorFrame } from '@/components/TopDecor';
import { StateView } from '@/components/StateView';
import { SessionRows } from '@/features/past-self/components';
import { warm } from '@/theme';

const TOP_DECOR = {
  source: require('../../../../assets/images/decor/past-top.png'),
  aspectRatio: 402 / 473,
};

// 지난 대화 전체 (과거의 나 첫 화면 오른쪽 위 말풍선)
export default function SessionsScreen() {
  const sessions = useChatSessions();
  // 당겨서 새로고침 표시는 사용자가 당겼을 때만 (뒤에서 다시 읽을 때 저절로 켜지지 않게)
  const [pulling, setPulling] = useState(false);
  const refresh = async () => {
    setPulling(true);
    try {
      await sessions.refetch();
    } finally {
      setPulling(false);
    }
  };

  if (sessions.isPending) return <StateView status="loading" />;
  if (sessions.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(sessions.error)}
        onRetry={() => void sessions.refetch()}
      />
    );
  }
  if (sessions.data.length === 0) {
    return <StateView status="empty" message="아직 나눈 대화가 없어요." />;
  }
  return (
    // 시안: 위쪽 동심원이 제목 줄 뒤부터 이어진다
    <TopDecorFrame decor={TOP_DECOR} style={styles.screen}>
      <Stack.Screen
        options={{ headerBackground: () => <HeaderDecor {...TOP_DECOR} /> }}
      />
      <Screen
        edges={[]}
        backgroundColor="transparent"
        refreshing={pulling}
        onRefresh={refresh}
      >
        <View>
          <SessionRows sessions={sessions.data} />
        </View>
      </Screen>
    </TopDecorFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
});
