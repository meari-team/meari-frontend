import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router';
// 투명한 제목 줄 아래로 내용을 내리려고 높이를 읽는다 (expo-router에 들어 있는 react-navigation)
import { useHeaderHeight } from 'expo-router/react-navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, errorMessage } from '@/api/errors';
import {
  useChatMessages,
  useChatSessions,
  useSendMessage,
  type ChatMessageDto,
} from '@/api/past-self';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { ScreenTopDecor } from '@/components/TopDecor';
import { AuthButton } from '@/features/auth/AuthButton';
import { TextButton } from '@/features/my/components';
import { StateView } from '@/components/StateView';
import {
  flattenPages,
  pastSelfTitle,
  shortKoreanDate,
} from '@/features/past-self/logic';
import { useTypewriter } from '@/features/past-self/typewriter';
import { shouldType } from '@/features/past-self/typewriter-logic';
import { isDateString } from '@/lib/dates';
import { colors, fonts, warm } from '@/theme';

const arrowUp = require('../../../../assets/images/chat/arrow-up.png');
// 위 동심원: 시안 '대화 시작·진행'(2:38·2:41) 위치 그대로 잘라 둔 그림
const TOP_DECOR = {
  source: require('../../../../assets/images/decor/chat-top.png'),
  aspectRatio: 402 / 473,
};
const bottomDecor = require('../../../../assets/images/decor/chat-bottom.png');

const MAX_LENGTH = 500;

// 빈 대화에서 눌러 바로 보내는 추천 질문
const SUGGESTIONS = [
  '요즘 제일 신경 쓰이는 게 뭐야?',
  '요즘 기분은 어때?',
  '그때 무슨 고민 있었어?',
];

// 과거의 나와 대화 (prd.md §7-2 ⑥⑧⑩, 기획안 그림 3)
export default function ChatScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    anchorDate?: string;
  }>();
  const sessionId = params.sessionId;
  const sessions = useChatSessions();
  const anchorDate = isDateString(params.anchorDate)
    ? params.anchorDate
    : sessions.data?.find((s) => s.id === sessionId)?.anchorDate;

  // 대화 중에는 하단 탭바를 숨긴다 (채팅 앱처럼 입력창이 화면 맨 아래에 붙게).
  // 탭 안 화면이라 탭바가 이미 아래 안전 영역을 차지해서, 그대로 두면 입력창 아래가 한 번 더 뜬다
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const tabs = navigation.getParent();
      tabs?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => tabs?.setOptions({ tabBarStyle: undefined });
    }, [navigation]),
  );

  const headerHeight = useHeaderHeight();
  const messages = useChatMessages(sessionId);
  const send = useSendMessage(sessionId);
  const [draft, setDraft] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const prependingRef = useRef(false);
  // 보내기 직전의 메시지 id들. 이후 새로 온 AI 답장만 타자로 보여 준다 (들어올 때 있던 대화는 바로 전체)
  const [typeAfter, setTypeAfter] = useState<ReadonlySet<string> | null>(null);

  const list = messages.data ? flattenPages(messages.data.pages) : [];
  const limitReached =
    send.error instanceof ApiError &&
    send.error.code === 'SESSION_MESSAGE_LIMIT';

  // 새 메시지·응답 대기 중에는 맨 아래로. 이전 메시지를 불러올 때는 그대로 둔다
  useEffect(() => {
    if (prependingRef.current) {
      prependingRef.current = false;
      return;
    }
    scroll.current?.scrollToEnd({ animated: true });
  }, [list.length, send.isPending, send.isError]);

  // 키보드가 올라와 대화 영역이 줄어들면 마지막 메시지가 가려지지 않게 맨 아래로
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () =>
      scroll.current?.scrollToEnd({ animated: true }),
    );
    return () => sub.remove();
  }, []);

  const submit = (text = draft) => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setTypeAfter(new Set(list.map((m) => m.id)));
    send.mutate(content, { onSuccess: () => setDraft('') });
  };

  const title = anchorDate ? pastSelfTitle(anchorDate) : '과거의 나';
  // 시안의 위쪽 동심원은 제목 줄 뒤부터 이어진다 (제목 줄 배경 + 본문을 같은 위치로)
  const header = (
    <Stack.Screen
      options={{
        title,
        // 제목 줄을 투명하게: 위쪽 동심원이 홈처럼 폰 화면 맨 위(상태바)부터 제목 뒤로 이어진다
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
      }}
    />
  );

  if (messages.isPending) {
    return (
      <>
        {header}
        <StateView status="loading" />
      </>
    );
  }
  if (messages.isError) {
    return (
      <>
        {header}
        <StateView
          status="error"
          message={errorMessage(messages.error)}
          onRetry={() => void messages.refetch()}
        />
      </>
    );
  }

  return (
    <>
      {header}
      {/* 위·아래 동심원 장식 (시안). 화면에 고정 */}
      <View style={styles.screen}>
        <ScreenTopDecor decor={TOP_DECOR} />
        <View style={styles.decorBottom} pointerEvents="none">
          <Image source={bottomDecor} style={styles.decorImage} />
        </View>
        <SafeAreaView
          style={[styles.safe, { paddingTop: headerHeight }]}
          edges={['bottom']}
        >
          {/* 입력창이 키보드 바로 위에 붙는다 (헤더 높이는 KeyboardAvoider가 직접 잰다) */}
          <KeyboardAvoider>
            {/* 상시 고지 (prd.md §7-2 ⑩, AI 기본법) — 헤더 아래 얇은 한 줄, 스크롤해도 남는다 */}
            <Text style={styles.notice} testID="chat-notice">
              {anchorDate
                ? `${shortKoreanDate(anchorDate)}까지의 기록으로 대화중\n`
                : ''}
              AI가 기록으로 재구성한 모습이에요.
            </Text>

            <ScrollView
              ref={scroll}
              style={styles.flex}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
            >
              {messages.hasNextPage ? (
                <TextButton
                  title={
                    messages.isFetchingNextPage
                      ? '불러오는 중…'
                      : '이전 메시지 보기'
                  }
                  disabled={messages.isFetchingNextPage}
                  onPress={() => {
                    prependingRef.current = true;
                    void messages.fetchNextPage();
                  }}
                />
              ) : null}

              {list.length === 0 && !send.isPending ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.empty}>
                    {anchorDate
                      ? `${pastSelfTitle(anchorDate)}에게 말을 걸어보세요.`
                      : '그때의 나에게 말을 걸어보세요.'}
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((q) => (
                      <Pressable
                        key={q}
                        accessibilityRole="button"
                        testID="chat-suggestion"
                        onPress={() => submit(q)}
                        style={({ pressed }) => [
                          styles.suggestion,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.suggestionText}>{q}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {list.map((m, i) => (
                <Bubble
                  key={m.id}
                  message={m}
                  typing={shouldType(m, i === list.length - 1, typeAfter)}
                  onTick={() =>
                    scroll.current?.scrollToEnd({ animated: false })
                  }
                />
              ))}

              {send.isPending && send.variables ? (
                <>
                  <Bubble
                    message={{
                      id: 'pending',
                      role: 'USER',
                      content: send.variables,
                      citations: [],
                      flag: 'NONE',
                      createdAt: '',
                    }}
                  />
                  <TypingDots />
                </>
              ) : null}

              {send.isError && send.variables && !limitReached ? (
                <View style={styles.failed}>
                  <Bubble
                    message={{
                      id: 'failed',
                      role: 'USER',
                      content: send.variables,
                      citations: [],
                      flag: 'NONE',
                      createdAt: '',
                    }}
                  />
                  <Text style={styles.failedText}>
                    {errorMessage(send.error)}
                  </Text>
                  <TextButton
                    title="다시 보내기"
                    testID="resend"
                    onPress={() => submit(send.variables)}
                  />
                </View>
              ) : null}
            </ScrollView>

            {limitReached ? (
              <View style={styles.limit}>
                <Text style={styles.limitText}>{errorMessage(send.error)}</Text>
                <AuthButton
                  title="오늘로 돌아오기"
                  onPress={() => router.navigate('/today')}
                />
              </View>
            ) : (
              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="그 때의 나에게 물어보기"
                  placeholderTextColor={warm.placeholder}
                  maxLength={MAX_LENGTH}
                  multiline
                  // 웹 textarea는 기본 2줄이라 한 줄에서 시작하게
                  numberOfLines={Platform.OS === 'web' ? 1 : undefined}
                  style={styles.input}
                  editable={!send.isPending}
                  testID="chat-input"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="보내기"
                  testID="chat-send"
                  disabled={!draft.trim() || send.isPending}
                  onPress={() => submit()}
                  style={({ pressed }) => [
                    styles.send,
                    (!draft.trim() || send.isPending) && styles.sendDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image source={arrowUp} style={styles.sendIcon} />
                </Pressable>
              </View>
            )}
          </KeyboardAvoider>
        </SafeAreaView>
      </View>
    </>
  );
}

// 답장을 기다리는 동안: 말풍선 자리에서 점 세 개가 차례로 깜빡인다
function TypingDots() {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View
      style={[styles.bubble, styles.assistant, styles.dots]}
      accessibilityLabel="답장을 쓰는 중"
      testID="chat-typing"
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.2 + i * 0.2, 0.4 + i * 0.2, 1],
                outputRange: [0.25, 1, 0.25, 0.25],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function Bubble({
  message,
  typing = false,
  onTick,
}: {
  message: ChatMessageDto;
  typing?: boolean;
  onTick?: () => void;
}) {
  const mine = message.role === 'USER';
  const typed = useTypewriter(message.content, typing, onTick);
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <Pressable
        // 치는 중에 누르면 남은 글자를 한 번에
        disabled={typed.done}
        onPress={typed.finish}
        accessibilityLabel={typed.done ? undefined : message.content}
        style={[styles.bubble, mine ? styles.mine : styles.assistant]}
        testID={mine ? undefined : 'assistant-bubble'}
      >
        <Text
          style={[styles.bubbleText, mine && styles.mineText]}
          selectable={typed.done}
        >
          {typed.text}
        </Text>
      </Pressable>
      {/* 근거·안내는 다 친 뒤에 */}
      {!typed.done ? null : !mine && message.citations.length > 0 ? (
        <View style={styles.citations}>
          <Text style={styles.citationLabel}>참고한 기록</Text>
          {message.citations.map((c) => (
            <Pressable
              key={c.entryId}
              accessibilityRole="link"
              accessibilityLabel={`${shortKoreanDate(c.date)} 일기 보기`}
              testID={`citation-${c.date}`}
              hitSlop={6}
              onPress={() =>
                router.push({
                  pathname: '/entry/[date]',
                  params: { date: c.date },
                })
              }
            >
              <Text style={styles.citationDate}>{shortKoreanDate(c.date)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {typed.done && !mine && message.flag === 'NO_EVIDENCE' ? (
        <Text style={styles.noEvidence}>
          기록에서 근거를 찾지 못한 답이에요.
        </Text>
      ) : null}
    </View>
  );
}

const BUBBLE_RADIUS = 20;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  // 웹은 Image의 aspectRatio를 무시해서 크기는 감싼 View가 정한다
  decorBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    aspectRatio: 402 / 466,
  },
  decorImage: { width: '100%', height: '100%' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  notice: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 16,
    color: warm.tan,
    textAlign: 'center',
  },
  messages: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 20,
  },
  emptyWrap: { alignItems: 'center', gap: 18, marginTop: 30 },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
  },
  suggestions: { alignItems: 'center', gap: 10 },
  suggestion: {
    height: 35,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: warm.tan,
    backgroundColor: warm.field,
  },
  suggestionText: { fontFamily: fonts.medium, fontSize: 13, color: warm.brown },
  bubbleWrap: { gap: 6, maxWidth: '72%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: BUBBLE_RADIUS },
  // 말한 쪽 아래 모서리만 작게 (꼬리 느낌)
  mine: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: warm.tan,
    borderBottomRightRadius: 7,
  },
  assistant: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: warm.field,
    borderWidth: 1.5,
    borderColor: warm.tan,
    borderBottomLeftRadius: 7,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.black,
  },
  mineText: { fontFamily: fonts.medium, color: warm.field },
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
  noEvidence: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: warm.tan,
    paddingHorizontal: 3,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 18,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: warm.tan },
  failed: { alignItems: 'flex-end', gap: 4 },
  failedText: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  limit: { gap: 10, paddingHorizontal: 25, paddingVertical: 14 },
  limitText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: warm.ink,
    textAlign: 'center',
  },
  // 시안: 알약 입력칸 + 진갈색 동그라미 보내기
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 13,
    paddingHorizontal: 25,
    paddingTop: 8,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    // 다섯 줄까지 늘어나고 그 뒤로는 입력창 안에서 스크롤
    maxHeight: 20 * 5 + 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: warm.tan,
    backgroundColor: warm.field,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: warm.ink,
    // 웹에서 포커스 때 생기는 파란 테두리 제거
    outlineWidth: 0,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warm.brown,
  },
  sendIcon: { width: 24, height: 24, tintColor: warm.field },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});
