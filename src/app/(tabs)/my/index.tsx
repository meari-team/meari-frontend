import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMe } from '@/api/auth';
import { useChecklist, useEntriesRange } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useUpdateMe } from '@/api/profile';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { recordStats, shiftDate } from '@/features/home/logic';
import {
  SettingsGroup,
  SettingsRow,
  StatTile,
  StyleOption,
} from '@/features/my/components';
import {
  DIARY_STYLES,
  NICKNAME_MAX,
  confirmedCount,
  diaryStyleLabel,
  initialOf,
  joinInfo,
  nicknameError,
  type DiaryStyle,
} from '@/features/my/logic';
import { todayKst } from '@/lib/dates';
import { useAuth } from '@/stores/auth';
import { colors, radius, spacing } from '@/theme';

const VERSION = Constants.expoConfig?.version ?? '0.1.0';

const ABOUT_PAST_SELF =
  '과거의 나는 고른 날짜까지 쓴 확정 일기만으로 AI가 재구성한 모습이에요. ' +
  '그 이후의 일은 모르고, 실제 그때의 나와 다를 수 있어요. ' +
  '대답 아래 근거 날짜를 누르면 그날 일기로 가요.';

type Open = 'style' | 'pastSelf' | 'logout' | null;

// 마이페이지: 프로필·기록 요약 → 설정 묶음 → 로그아웃·탈퇴
export default function MyScreen() {
  const today = todayKst();
  const me = useMe();
  const checklist = useChecklist();
  // 기록 요약은 최근 1년 (목록 API 최대 366일)
  const range = useEntriesRange(shiftDate(today, { days: -365 }), today);
  const update = useUpdateMe();
  const signOut = useAuth((s) => s.signOut);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [open, setOpen] = useState<Open>(null);
  const toggle = (key: Exclude<Open, null>) =>
    setOpen((o) => (o === key ? null : key));

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
  const joined = joinInfo(user.createdAt, today);
  const nickError = editing ? nicknameError(nickname) : null;
  const startEdit = () => {
    setNickname(user.nickname);
    update.reset();
    setEditing(true);
  };
  const saveNickname = () =>
    update.mutate(
      { nickname: nickname.trim() },
      { onSuccess: () => setEditing(false) },
    );
  const chooseStyle = (diaryStyle: DiaryStyle) => {
    if (diaryStyle !== user.diaryStyle) update.mutate({ diaryStyle });
  };

  const stats = range.data
    ? { total: confirmedCount(range.data), ...recordStats(range.data, today) }
    : null;
  const statValue = (n: number | undefined, unit: string) =>
    n === undefined ? '–' : `${n}${unit}`;

  return (
    <Screen edges={['top']}>
      <Text style={styles.pageTitle}>마이페이지</Text>

      {/* 프로필 */}
      <View style={styles.profileCard}>
        {editing ? (
          <View style={styles.editBox}>
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
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`닉네임 ${user.nickname}, 눌러서 수정`}
            onPress={startEdit}
            style={({ pressed }) => [styles.profile, pressed && styles.dim]}
            testID="nickname-edit"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialOf(user.nickname)}</Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname} testID="nickname">
                  {user.nickname}
                </Text>
                <Ionicons name="pencil" size={15} color={colors.textMuted} />
              </View>
              <Text style={styles.muted}>{user.email}</Text>
              <Text style={styles.since}>
                {joined.label} 가입 · 함께한 지 {joined.days}일째
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.stats}>
          <StatTile
            value={statValue(stats?.total, '편')}
            label="확정한 일기"
            testID="my-stat-total"
          />
          <StatTile
            value={statValue(stats?.monthCount, '일')}
            label={`${Number(today.slice(5, 7))}월 기록`}
          />
          <StatTile value={statValue(stats?.streak, '일')} label="연속 기록" />
        </View>
      </View>

      {update.isError ? (
        <Text style={styles.error}>{errorMessage(update.error)}</Text>
      ) : null}

      {/* AI 설정 */}
      <SettingsGroup title="AI 설정">
        <SettingsRow
          icon="color-wand-outline"
          title="AI 일기 문체"
          description="초안을 쓸 때의 말투"
          value={diaryStyleLabel(user.diaryStyle)}
          expanded={open === 'style'}
          onPress={() => toggle('style')}
          last={open !== 'style'}
          testID="open-style"
        />
        {open === 'style' ? (
          <View style={styles.expand} accessibilityRole="radiogroup">
            {DIARY_STYLES.map((s) => (
              <StyleOption
                key={s.value}
                option={s}
                selected={user.diaryStyle === s.value}
                disabled={update.isPending}
                onPress={() => chooseStyle(s.value)}
              />
            ))}
            <Text style={styles.note}>
              지금은 저장만 되고, AI 일기에는 곧 반영돼요.
            </Text>
          </View>
        ) : null}
      </SettingsGroup>

      {/* 기록 */}
      <SettingsGroup title="기록">
        <SettingsRow
          icon="book-outline"
          tint={colors.success}
          title="전체 일기 보기"
          value={stats ? `${stats.total}편` : undefined}
          onPress={() =>
            router.navigate({
              pathname: '/calendar',
              params: { mode: 'list', at: String(Date.now()) },
            })
          }
          testID="open-all-entries"
        />
        <SettingsRow
          icon="checkbox-outline"
          tint={colors.warning}
          title="체크리스트 관리"
          description="오늘의 일기에서 고르는 항목"
          value={
            checklist.data ? `카테고리 ${checklist.data.length}개` : undefined
          }
          onPress={() => router.push('/my/checklist')}
          last
          testID="open-checklist"
        />
      </SettingsGroup>

      {/* 안내 */}
      <SettingsGroup title="안내">
        <SettingsRow
          icon="sparkles-outline"
          title="과거의 나는 이렇게 만들어져요"
          expanded={open === 'pastSelf'}
          onPress={() => toggle('pastSelf')}
          testID="open-about-past-self"
        />
        {open === 'pastSelf' ? (
          <Text style={[styles.expand, styles.expandDivider, styles.aboutText]}>
            {ABOUT_PAST_SELF}
          </Text>
        ) : null}
        <SettingsRow
          icon="shield-checkmark-outline"
          tint={colors.success}
          title="개인정보 처리방침"
          description="모으는 정보, 외부 AI, 보관과 삭제"
          onPress={() => router.push('/my/privacy')}
          testID="open-privacy"
        />
        <SettingsRow
          icon="information-circle-outline"
          tint={colors.textMuted}
          title="버전"
          value={VERSION}
          last
        />
      </SettingsGroup>

      {/* 계정 */}
      <SettingsGroup>
        <SettingsRow
          icon="log-out-outline"
          tint={colors.textMuted}
          title="로그아웃"
          onPress={() => toggle('logout')}
          last={open !== 'logout'}
          testID="open-logout"
        />
        {open === 'logout' ? (
          <View style={styles.expand}>
            <Text style={styles.aboutText}>
              로그아웃할까요? 기록은 그대로 남아 있어요.
            </Text>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button
                  title="취소"
                  variant="ghost"
                  onPress={() => setOpen(null)}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  title="로그아웃"
                  onPress={signOut}
                  testID="logout-confirm"
                />
              </View>
            </View>
          </View>
        ) : null}
      </SettingsGroup>

      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push('/my/withdraw')}
        style={({ pressed }) => [styles.withdraw, pressed && styles.dim]}
        testID="open-withdraw"
      >
        <Text style={styles.withdrawText}>회원 탈퇴</Text>
      </Pressable>

      <Text style={styles.footer}>
        메아리 {VERSION} · AI가 기록으로 재구성한 내용은 실제와 다를 수 있어요.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  dim: { opacity: 0.7 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    paddingTop: spacing.sm,
  },
  profileCard: {
    gap: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editBox: { gap: spacing.sm + 4 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 21, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  since: { fontSize: 13, color: colors.primary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  expand: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  // 펼친 내용 아래에 다른 행이 이어질 때
  expandDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  aboutText: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14 },
  withdraw: { alignSelf: 'center', paddingVertical: spacing.xs },
  withdrawText: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
