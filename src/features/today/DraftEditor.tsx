import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useConfirm, useGenerate, type EntryDto } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/theme';
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
          <Badge label="AI가 쓴 초안" tone="info" icon="sparkles-outline" />
          <Text style={styles.aiNoteText}>
            사실과 다른 부분이 있으면 고쳐 주세요. 저장한 내용만 기억이 돼요.
          </Text>
        </View>
      ) : null}

      {uncertain.length > 0 ? (
        <Section title="확인이 필요한 문장" hint="AI가 추측해서 쓴 부분이에요">
          {uncertain.map((s) => (
            <Text key={s} style={styles.uncertain}>
              {s}
            </Text>
          ))}
        </Section>
      ) : null}

      <TextField
        label={mode === 'write' ? '오늘의 일기' : '일기 내용'}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={CONTENT_MAX}
        placeholder="오늘 있었던 일을 적어 주세요"
        style={styles.editor}
        textAlignVertical="top"
        testID="today-editor"
      />

      {error ? <Text style={styles.error}>{errorMessage(error)}</Text> : null}

      <Button
        title={mode === 'edit' ? '수정 저장' : '이대로 저장'}
        onPress={save}
        disabled={text.trim().length === 0}
        loading={confirm.isPending}
      />
      {mode === 'draft' ? (
        <Button title="다시 만들기" variant="ghost" onPress={askRegenerate} />
      ) : null}
      {onCancel ? (
        <Button title="취소" variant="ghost" onPress={onCancel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  aiNote: { gap: spacing.xs },
  aiNoteText: { fontSize: 13, color: colors.textMuted },
  uncertain: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editor: { minHeight: 220, paddingTop: spacing.sm + 4, lineHeight: 24 },
  error: { fontSize: 14, color: colors.danger },
});
