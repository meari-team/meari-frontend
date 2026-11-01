import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EchoDto } from '@/api/echo';
import { SafeImage } from '@/components/SafeImage';
import { echoArrivalLabel } from '@/lib/echo';
import { fonts, warm } from '@/theme';

// 접힌 일기는 이만큼만
const COLLAPSED_LINES = 5;

// 메아리로 시작된 대화의 머리: 날짜 구분 → 그날 사진 → 그날 확정 일기 (받은 메시지처럼).
// 과거의 나가 먼저 보낸 첫 메시지는 대화 목록 첫 줄로 이어진다
export function EchoIntro({ echo }: { echo: EchoDto }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const openEntry = () =>
    router.push({
      pathname: '/entry/[date]',
      params: { date: echo.entryDate },
    });

  return (
    <View style={styles.wrap} testID="echo-intro">
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>
          {echoArrivalLabel(echo.entryDate)}
        </Text>
        <View style={styles.line} />
      </View>

      {echo.photos.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="그날 일기 보기"
          onPress={openEntry}
          style={[styles.bubble, styles.photoBubble]}
          testID="echo-photos"
        >
          {echo.photos.slice(0, 3).map((p) => (
            <SafeImage
              key={p.id}
              uri={p.url}
              style={[
                styles.photo,
                echo.photos.length === 1 && styles.photoSingle,
              ]}
              accessibilityLabel="그날 사진"
            />
          ))}
        </Pressable>
      ) : null}

      {echo.finalContent ? (
        <View style={[styles.bubble, styles.diary]} testID="echo-diary">
          <Text style={styles.diaryLabel}>그날의 일기</Text>
          <Text
            style={styles.diaryText}
            numberOfLines={open ? undefined : COLLAPSED_LINES}
            onTextLayout={(e) => {
              if (!open && e.nativeEvent.lines.length >= COLLAPSED_LINES)
                setLong(true);
            }}
          >
            {echo.finalContent}
          </Text>
          {long || open ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setOpen((o) => !o)}
              testID="echo-diary-toggle"
            >
              <Text style={styles.more}>{open ? '접기' : '펼쳐 보기'}</Text>
            </Pressable>
          ) : null}
          {echo.entryEdited ? (
            <Text style={styles.edited}>
              메시지를 받은 뒤 일기를 고쳤어요. 지금 일기를 보여 드려요.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  line: { flex: 1, height: 1, backgroundColor: warm.sand },
  dividerText: { fontFamily: fonts.semibold, fontSize: 11, color: warm.tan },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    borderRadius: 20,
    borderBottomLeftRadius: 7,
    borderWidth: 1.5,
    borderColor: warm.tan,
    backgroundColor: warm.field,
  },
  photoBubble: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  photo: { width: 78, height: 78, borderRadius: 12 },
  photoSingle: { width: 180, height: 180 },
  diary: { paddingHorizontal: 20, paddingVertical: 14, gap: 6 },
  diaryLabel: { fontFamily: fonts.semibold, fontSize: 11, color: warm.tan },
  diaryText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.black,
  },
  more: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: warm.brown,
    textDecorationLine: 'underline',
  },
  edited: { fontFamily: fonts.medium, fontSize: 11, color: warm.tan },
});
