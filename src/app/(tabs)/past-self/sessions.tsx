import { errorMessage } from '@/api/errors';
import { useChatSessions } from '@/api/past-self';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { SessionRows } from '@/features/past-self/components';

// 지난 대화 전체 (과거의 나 첫 화면의 최근 대화 → 전체 보기)
export default function SessionsScreen() {
  const sessions = useChatSessions();

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
      refreshing={sessions.isRefetching}
      onRefresh={() => void sessions.refetch()}
    >
      <SessionRows sessions={sessions.data} />
    </Screen>
  );
}
