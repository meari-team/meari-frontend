import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEcho, useMarkEchoRead } from '@/api/echo';
import { errorMessage } from '@/api/errors';
import { StateView } from '@/components/StateView';
import { EchoIntro } from '@/features/echo/EchoIntro';
import { pastSelfTitle, shortKoreanDate } from '@/features/past-self/logic';
import { fonts, warm } from '@/theme';

// 알림·받은 메아리 목록에서 여는 곳.
// 대화방이 있으면 그 대화방으로 바로 넘어가고(대화 시작 버튼 없이 바로 답장),
// 기준일까지 기록이 모자라 대화방이 없으면 사진·일기·첫 메시지만 보여 주고 이유를 안내한다
export default function EchoScreen() {
  const { echoId } = useLocalSearchParams<{ echoId: string }>();
  const echo = useEcho(echoId);
  const { mutate: markRead } = useMarkEchoRead();
  const unread = echo.data && !echo.data.readAt && !echo.data.sessionId;
  useEffect(() => {
    if (unread) markRead(echoId);
  }, [unread, echoId, markRead]);

  if (echo.isPending) return <StateView status="loading" />;
  if (echo.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(echo.error)}
        onRetry={() => void echo.refetch()}
      />
    );
  }

  const e = echo.data;
  if (e.sessionId) {
    return (
      <Redirect
        href={{
          pathname: '/past-self/[sessionId]',
          params: {
            sessionId: e.sessionId,
            anchorDate: e.entryDate,
            echoId: e.id,
          },
        }}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: pastSelfTitle(e.entryDate) }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        testID="echo-readonly"
      >
        <Text style={styles.notice}>
          {`${shortKoreanDate(e.entryDate)}까지의 기록으로 만든 메시지\n`}
          AI가 기록으로 재구성한 모습이에요.
        </Text>
        <EchoIntro echo={e} />
        <View style={styles.bubbleWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{e.message}</Text>
          </View>
          {e.citations.length > 0 ? (
            <View style={styles.citations}>
              <Text style={styles.citationLabel}>참고한 기록</Text>
              {e.citations.map((c) => (
                <Pressable
                  key={c.entryId}
                  accessibilityRole="link"
                  hitSlop={6}
                  onPress={() =>
                    router.push({
                      pathname: '/entry/[date]',
                      params: { date: c.date },
                    })
                  }
                >
                  <Text style={styles.citationDate}>
                    {shortKoreanDate(c.date)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.limit} testID="echo-chat-unavailable">
          <Text style={styles.limitText}>
            {`이날까지 기록이 ${e.chat.recordCount}일이라 아직 대화할 수 없어요.\n${e.chat.requiredCount}일 이상 쌓이면 이날의 나와 이야기할 수 있어요.`}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  content: { paddingHorizontal: 28, paddingBottom: 40, gap: 20 },
  notice: {
    paddingTop: 6,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 16,
    color: warm.tan,
    textAlign: 'center',
  },
  bubbleWrap: { gap: 6, maxWidth: '80%', alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 7,
    borderWidth: 1.5,
    borderColor: warm.tan,
    backgroundColor: warm.field,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.black,
  },
  citations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
    paddingHorizontal: 3,
  },
  citationLabel: { fontFamily: fonts.semibold, fontSize: 11, color: warm.tan },
  citationDate: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: warm.brown,
    textDecorationLine: 'underline',
  },
  limit: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: warm.field,
  },
  limitText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: warm.ink,
    textAlign: 'center',
  },
});
