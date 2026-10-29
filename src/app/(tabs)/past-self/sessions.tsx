import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { useChatSessions } from '@/api/past-self';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { SessionRows } from '@/features/past-self/components';
import { warm } from '@/theme';

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
    <Screen
      edges={[]}
      backgroundColor={warm.background}
      refreshing={pulling}
      onRefresh={refresh}
    >
      <SessionRows sessions={sessions.data} />
    </Screen>
  );
}
