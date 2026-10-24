import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMe } from '@/api/auth';
import { useChecklist } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useUpdateMe } from '@/api/profile';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StateView } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import {
  DIARY_STYLES,
  NICKNAME_MAX,
  nicknameError,
  type DiaryStyle,
} from '@/features/my/logic';
import { useAuth } from '@/stores/auth';
import { colors, spacing } from '@/theme';

export default function MyScreen() {
  const me = useMe();
  const checklist = useChecklist();
  const update = useUpdateMe();
  const signOut = useAuth((s) => s.signOut);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');

  if (me.isPending) return <StateView status="loading" />;
  if (me.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(me.error)}
        onRetry={() => void me.refetch()}
      />
    );
  }

  const user = me.data;
  const nickError = editing ? nicknameError(nickname) : null;
  const saveNickname = () =>
    update.mutate(
      { nickname: nickname.trim() },
      { onSuccess: () => setEditing(false) },
    );
  const chooseStyle = (diaryStyle: DiaryStyle) => {
    if (diaryStyle !== user.diaryStyle) update.mutate({ diaryStyle });
  };

  return (
    <Screen edges={[]}>
      <Section title="프로필">
        {editing ? (
          <>
            <TextField
              label="닉네임"
              value={nickname}
              onChangeText={setNickname}
              maxLength={NICKNAME_MAX}
              hint={`최대 ${NICKNAME_MAX}자`}
              error={nickname.length > 0 ? nickError : null}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={
                nickError || update.isPending ? undefined : saveNickname
              }
              testID="nickname-input"
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button
                  title="취소"
                  variant="ghost"
                  disabled={update.isPending}
                  onPress={() => {
                    setEditing(false);
                    update.reset();
                  }}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  title="저장"
                  disabled={!!nickError}
                  loading={update.isPending}
                  onPress={saveNickname}
                  testID="nickname-save"
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.profile}>
            <View style={styles.flex}>
              <Text style={styles.nickname} testID="nickname">
                {user.nickname}
              </Text>
              <Text style={styles.muted}>{user.email}</Text>
            </View>
            <Button
              title="수정"
              variant="ghost"
              onPress={() => {
                setNickname(user.nickname);
                update.reset();
                setEditing(true);
              }}
              testID="nickname-edit"
            />
          </View>
        )}
      </Section>

      <Section
        title="AI 일기 문체"
        hint="초안을 쓸 때의 말투예요. 지금은 저장만 되고, AI 일기에는 곧 반영돼요."
      >
        <View style={styles.chips}>
          {DIARY_STYLES.map((s) => (
            <Chip
              key={s.value}
              label={`${s.label} · ${s.hint}`}
              selected={user.diaryStyle === s.value}
              disabled={update.isPending}
              onPress={() => chooseStyle(s.value)}
              testID={`style-${s.value}`}
            />
          ))}
        </View>
      </Section>

      {update.isError ? (
        <Text style={styles.error}>{errorMessage(update.error)}</Text>
      ) : null}

      <Section
        title="체크리스트"
        hint={
          checklist.data
            ? `카테고리 ${checklist.data.length}개 · 오늘의 일기에서 고르는 항목이에요`
            : '오늘의 일기에서 고르는 항목이에요'
        }
      >
        <Button
          title="체크리스트 편집"
          variant="ghost"
          onPress={() => router.push('/my/checklist')}
          testID="open-checklist"
        />
      </Section>

      <Section title="계정">
        <Button title="로그아웃" variant="ghost" onPress={signOut} />
        <Button
          title="회원 탈퇴"
          variant="ghost"
          onPress={() => router.push('/my/withdraw')}
          testID="open-withdraw"
        />
      </Section>

      <Text style={styles.footer}>
        메아리 0.1.0 · AI가 기록으로 재구성한 내용은 실제와 다를 수 있어요.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nickname: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
