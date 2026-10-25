import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
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
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { KeyboardAvoider } from '@/components/KeyboardAvoider';
import { StateView } from '@/components/StateView';
import {
  flattenPages,
  pastSelfTitle,
  shortKoreanDate,
} from '@/features/past-self/logic';
import { isDateString } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

const MAX_LENGTH = 500;

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

  const messages = useChatMessages(sessionId);
  const send = useSendMessage(sessionId);
  const [draft, setDraft] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const prependingRef = useRef(false);

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
    send.mutate(content, { onSuccess: () => setDraft('') });
  };

  const title = anchorDate ? pastSelfTitle(anchorDate) : '과거의 나';
  const header = <Stack.Screen options={{ title }} />;

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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {/* 입력창이 키보드 바로 위에 붙는다 (헤더 높이는 KeyboardAvoider가 직접 잰다) */}
        <KeyboardAvoider>
          {/* 상시 고지 (prd.md §7-2 ⑩, AI 기본법) */}
          <View style={styles.notice} testID="chat-notice">
            {anchorDate ? (
              <Badge
                label={`${shortKoreanDate(anchorDate)}까지의 기록으로 대화 중`}
                tone="info"
                icon="time-outline"
              />
            ) : null}
            <Text style={styles.noticeText}>
              AI가 기록으로 재구성한 모습이며 실제와 다를 수 있어요.
            </Text>
          </View>

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
              <Button
                title={
                  messages.isFetchingNextPage
                    ? '불러오는 중…'
                    : '이전 메시지 보기'
                }
                variant="ghost"
                disabled={messages.isFetchingNextPage}
                onPress={() => {
                  prependingRef.current = true;
                  void messages.fetchNextPage();
                }}
              />
            ) : null}

            {list.length === 0 && !send.isPending ? (
              <Text style={styles.empty}>
                {anchorDate
                  ? `${pastSelfTitle(anchorDate)}에게 요즘 어떻게 지내는지 물어보세요.`
                  : '그때의 나에게 말을 걸어 보세요.'}
              </Text>
            ) : null}

            {list.map((m) => (
              <Bubble key={m.id} message={m} />
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
                <View style={[styles.bubble, styles.assistant, styles.typing]}>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={styles.typingText}>기억을 떠올리는 중…</Text>
                </View>
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
                <Button
                  title="다시 보내기"
                  variant="ghost"
                  testID="resend"
                  onPress={() => submit(send.variables)}
                />
              </View>
            ) : null}
          </ScrollView>

          {limitReached ? (
            <View style={styles.limit}>
              <Text style={styles.limitText}>{errorMessage(send.error)}</Text>
              <Button
                title="오늘로 돌아오기"
                onPress={() => router.navigate('/today')}
              />
            </View>
          ) : (
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="그때의 나에게 물어보기"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_LENGTH}
                multiline
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
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={colors.primaryText}
                />
              </Pressable>
            </View>
          )}
        </KeyboardAvoider>
      </SafeAreaView>
    </>
  );
}

function Bubble({ message }: { message: ChatMessageDto }) {
  const mine = message.role === 'USER';
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <View
        style={[styles.bubble, mine ? styles.mine : styles.assistant]}
        testID={mine ? undefined : 'assistant-bubble'}
      >
        <Text style={[styles.bubbleText, mine && styles.mineText]} selectable>
          {message.content}
        </Text>
      </View>
      {!mine && message.citations.length > 0 ? (
        <View style={styles.citations}>
          <Text style={styles.citationLabel}>참고한 기록</Text>
          {message.citations.map((c) => (
            <Chip
              key={c.entryId}
              label={shortKoreanDate(c.date)}
              testID={`citation-${c.date}`}
              onPress={() =>
                router.push({
                  pathname: '/entry/[date]',
                  params: { date: c.date },
                })
              }
            />
          ))}
        </View>
      ) : null}
      {!mine && message.flag === 'NO_EVIDENCE' ? (
        <Text style={styles.noEvidence}>
          기록에서 근거를 찾지 못한 답이에요.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  notice: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeText: { fontSize: 12, color: colors.textMuted },
  messages: { padding: spacing.md, gap: spacing.md },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  bubbleWrap: { gap: spacing.xs, maxWidth: '85%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  mine: { backgroundColor: colors.primary },
  assistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.text },
  mineText: { color: colors.primaryText },
  citations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  citationLabel: { fontSize: 12, color: colors.textMuted },
  noEvidence: { fontSize: 12, color: colors.warning },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  typingText: { fontSize: 14, color: colors.textMuted },
  failed: { alignItems: 'flex-end', gap: spacing.xs },
  failedText: { fontSize: 13, color: colors.danger },
  limit: {
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  limitText: { fontSize: 14, color: colors.text, textAlign: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md - 4,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.8 },
});
