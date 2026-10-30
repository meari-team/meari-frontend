import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useConfirm, useGenerate, type EntryDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { AuthButton } from '@/features/auth/AuthButton';
import { OutlineButton, TextButton } from '@/features/my/components';
import { colors, fonts, warm } from '@/theme';
import { BusyView, GENERATE_MESSAGES } from './BusyView';

const CONTENT_MAX = 10_000;

type Props = {
  date: string;
  entry: EntryDto;
  // AI 초안(GENERATED) · 직접 쓰기(READY) · 확정본 수정(CONFIRMED)
  mode: 'draft' | 'write' | 'edit';
  onDone?: () => void;
  onCancel?: () => void;
};

// 3단계: 초안을 읽고 고친 뒤 확정한다. 확정본만 기억이 된다
export function DraftEditor({ date, entry, mode, onDone, onCancel }: Props) {
  const initial =
    mode === 'edit'
      ? (entry.finalContent ?? '')
      : mode === 'draft'
        ? (entry.aiDraft ?? '')
        : '';
  const [text, setText] = useState(initial);
  const confirm = useConfirm(date);
  const regenerate = useGenerate(date);

  if (regenerate.isPending) return <BusyView messages={GENERATE_MESSAGES} />;

  const save = () =>
    confirm.mutate(text.trim(), {
      onSuccess: () => onDone?.(),
    });

  const askRegenerate = () => {
    if (text.trim() === (entry.aiDraft ?? '').trim()) {
      regenerate.mutate({}, { onSuccess: (r) => setText(r.aiDraft) });
      return;
    }
    Alert.alert(
      '다시 만들까요?',
      '고친 내용은 사라지고 새 초안으로 바뀌어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '다시 만들기',
          style: 'destructive',
          onPress: () =>
            regenerate.mutate({}, { onSuccess: (r) => setText(r.aiDraft) }),
        },
      ],
    );
  };

  const uncertain = mode === 'draft' ? entry.aiUncertain : [];
  const error = confirm.error ?? regenerate.error;

  return (
    <View style={styles.wrap}>
      {mode === 'draft' ? (
        <View style={styles.aiNote}>
          {/* 시안: 테두리만 있는 작은 알약 (아이콘 없이) */}
          <Text style={styles.aiChip}>AI가 쓴 초안</Text>
          <Text style={styles.aiNoteText}>
            사실과 다른 부분이 있으면 고쳐주세요. 저장한 내용만 기억이 돼요.
          </Text>
        </View>
      ) : null}

      {uncertain.length > 0 ? (
        <View style={styles.uncertainBox}>
          <Text style={styles.uncertainTitle}>
            확인이 필요한 문장 · AI가 추측해서 쓴 부분이에요
          </Text>
          {uncertain.map((s) => (
            <Text key={s} style={styles.uncertain}>
              {s}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {mode === 'write' ? '오늘의 일기' : '일기 내용'}
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          maxLength={CONTENT_MAX}
          placeholder="오늘 있었던 일을 적어 주세요"
          placeholderTextColor={warm.placeholder}
          accessibilityLabel={mode === 'write' ? '오늘의 일기' : '일기 내용'}
          style={styles.editor}
          textAlignVertical="top"
          testID="today-editor"
        />
      </View>

      {error ? <Text style={styles.error}>{errorMessage(error)}</Text> : null}

      <View style={styles.buttons}>
        <AuthButton
          title={mode === 'edit' ? '수정 저장' : '이대로 저장'}
          onPress={save}
          disabled={text.trim().length === 0}
          loading={confirm.isPending}
        />
        {mode === 'draft' ? (
          <OutlineButton title="다시 만들기" onPress={askRegenerate} />
        ) : null}
        {onCancel ? <TextButton title="취소" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  aiNote: { gap: 8, marginTop: -4 },
  aiChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: warm.sand,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: warm.ink,
    overflow: 'hidden',
  },
  aiNoteText: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  uncertainBox: {
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: warm.sand,
  },
  uncertainTitle: { fontFamily: fonts.semibold, fontSize: 12, color: warm.tan },
  uncertain: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.ink,
  },
  // 홈과 같은 종이 카드 안에 바로 쓰는 칸
  card: {
    gap: 8,
    padding: 20,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  editor: {
    minHeight: 180,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.black,
    // 웹에서 포커스 때 생기는 파란 테두리 제거
    outlineWidth: 0,
  },
  buttons: { gap: 17 },
  error: { fontSize: 14, color: colors.danger },
});
