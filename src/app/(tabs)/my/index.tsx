import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMe } from '@/api/auth';
import { useChecklist, useEntriesRange } from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { useUpdateMe } from '@/api/profile';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { AuthButton } from '@/features/auth/AuthButton';
import { AuthField } from '@/features/auth/AuthField';
import { recordStats, shiftDate } from '@/features/home/logic';
import {
  SettingsGroup,
  SettingsRow,
  StatTile,
  Expand,
  StylePicker,
} from '@/features/my/components';
import {
  DIARY_STYLES,
  NICKNAME_MAX,
  diaryStyleLabel,
  joinInfo,
  nicknameError,
  type DiaryStyle,
} from '@/features/my/logic';
import { todayKst } from '@/lib/dates';
import { useAuth } from '@/stores/auth';
import { colors, fonts, spacing, warm } from '@/theme';

const VERSION = Constants.expoConfig?.version ?? '0.1.0';

const background = require('../../../../assets/images/decor/my-bg.png');

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
    ? { total: range.data.length, ...recordStats(range.data, today) }
    : null;
  const statValue = (n: number | undefined, unit: string) =>
    n === undefined ? '–' : `${n}${unit}`;

  return (
    <View style={styles.screen}>
      {/* 위·아래 동심원 장식 (시안). 화면에 고정되고 카드가 위로 지나간다 */}
      <View style={styles.decor} pointerEvents="none">
        <Image source={background} style={styles.decorImage} />
      </View>
      <Screen edges={['top']} backgroundColor="transparent">
        <Text style={styles.pageTitle}>마이페이지</Text>

        {/* 프로필 */}
        <View style={styles.profileCard}>
          {editing ? (
            <View style={styles.editBox}>
              <AuthField
                placeholder="닉네임"
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
              <AuthButton
                title="저장"
                disabled={!!nickError}
                loading={update.isPending}
                onPress={saveNickname}
                testID="nickname-save"
              />
              <Pressable
                accessibilityRole="button"
                disabled={update.isPending}
                onPress={() => {
                  setEditing(false);
                  update.reset();
                }}
                style={({ pressed }) => [
                  styles.textButton,
                  pressed && styles.dim,
                ]}
              >
                <Text style={styles.textButtonLabel}>취소</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`닉네임 ${user.nickname}, 눌러서 수정`}
              onPress={startEdit}
              style={({ pressed }) => [styles.profile, pressed && styles.dim]}
              testID="nickname-edit"
            >
              <View style={styles.flex}>
                {/* 이름을 누르면 닉네임 수정 */}
                <Text style={styles.nickname} testID="nickname">
                  {user.nickname}
                </Text>
                <Text style={styles.muted}>{user.email}</Text>
                <Text style={styles.since}>
                  {joined.label} 가입 - 함께한 지 {joined.days}일 째
                </Text>
              </View>
            </Pressable>
          )}

          <View style={styles.stats}>
            <StatTile
              value={statValue(stats?.total, '편')}
              label="총 일기"
              testID="my-stat-total"
            />
            <StatTile
              value={statValue(stats?.monthCount, '일')}
              label="이번 달 기록"
            />
            <StatTile
              value={statValue(stats?.streak, '일')}
              label="연속 기록"
            />
          </View>
        </View>

        {update.isError ? (
          <Text style={styles.error}>{errorMessage(update.error)}</Text>
        ) : null}

        <SettingsGroup title="계정">
          <SettingsRow
            title="비밀번호 변경"
            testID="my-password"
            onPress={() => router.push('/my/password')}
            last
          />
        </SettingsGroup>

        {/* AI 설정 */}
        <SettingsGroup title="AI 설정">
          <SettingsRow
            title="AI 일기 문체"
            value={diaryStyleLabel(user.diaryStyle)}
            expanded={open === 'style'}
            onPress={() => toggle('style')}
            last
            testID="open-style"
          />
          {open === 'style' ? (
            <Expand>
              <StylePicker
                options={DIARY_STYLES}
                value={user.diaryStyle}
                disabled={update.isPending}
                onChange={chooseStyle}
              />
              <Text style={styles.note}>
                지금은 저장만 되고, AI 일기에는 곧 반영돼요.
              </Text>
            </Expand>
          ) : null}
        </SettingsGroup>

        {/* 기록 */}
        <SettingsGroup title="기록">
          <SettingsRow
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
            title="과거의 나는 이렇게 만들어져요"
            expanded={open === 'pastSelf'}
            onPress={() => toggle('pastSelf')}
            last={open === 'pastSelf'}
            testID="open-about-past-self"
          />
          {open === 'pastSelf' ? (
            <Expand divider>
              <View style={styles.aboutBox}>
                <Text style={styles.aboutText}>{ABOUT_PAST_SELF}</Text>
              </View>
            </Expand>
          ) : null}
          <SettingsRow
            title="개인정보 처리방침"
            description="모으는 정보, 외부 AI, 보관과 삭제"
            onPress={() => router.push('/my/privacy')}
            testID="open-privacy"
            last
          />
        </SettingsGroup>

        {/* 계정 */}
        <SettingsGroup>
          <SettingsRow
            title="로그아웃"
            expanded={open === 'logout'}
            onPress={() => toggle('logout')}
            last
            testID="open-logout"
          />
          {open === 'logout' ? (
            <Expand>
              <Text style={styles.aboutText}>
                로그아웃할까요? 기록은 그대로 남아 있어요.
              </Text>
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(null)}
                  style={({ pressed }) => [
                    styles.half,
                    styles.outline,
                    pressed && styles.dim,
                  ]}
                >
                  <Text style={styles.outlineText}>취소</Text>
                </Pressable>
                <View style={styles.half}>
                  <AuthButton
                    title="로그아웃"
                    onPress={signOut}
                    testID="logout-confirm"
                  />
                </View>
              </View>
            </Expand>
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
          메아리 {VERSION} · AI가 기록으로 재구성한 내용은 실제와 다를 수
          있어요.
        </Text>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  // 웹은 Image의 aspectRatio를 무시해서 크기는 감싼 View가 정한다
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 402 / 874,
  },
  decorImage: { width: '100%', height: '100%' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  dim: { opacity: 0.7 },
  pageTitle: { fontFamily: fonts.bold, fontSize: 24, color: warm.black },
  profileCard: {
    gap: 17,
    padding: 20,
    marginBottom: 2,
    borderRadius: 10,
    backgroundColor: warm.field,
    shadowColor: warm.brown,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 3,
  },
  editBox: { gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center' },
  nickname: { fontFamily: fonts.bold, fontSize: 20, color: warm.black },
  muted: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    marginTop: 8,
  },
  since: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    marginTop: 3,
  },
  stats: { flexDirection: 'row', gap: 16 },
  textButton: { alignSelf: 'center', padding: 6 },
  textButtonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: warm.brown,
  },
  outline: {
    height: 45,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: warm.tan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontFamily: fonts.semibold, fontSize: 16, color: warm.brown },
  // 과거의 나 안내: 바탕색 종이 조각
  aboutBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: warm.background,
  },
  aboutText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: warm.ink,
  },
  note: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
  },
  error: { color: colors.danger, fontSize: 14 },
  withdraw: { alignSelf: 'center', paddingVertical: spacing.xs },
  withdrawText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: warm.tan,
    textDecorationLine: 'underline',
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
