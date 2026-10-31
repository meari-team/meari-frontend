import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useAnalyze,
  useDeletePhoto,
  useSaveEntryInput,
  useUploadPhoto,
  type ChecklistCategoryDto,
  type EntryDto,
} from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { PhotoGrid, type PhotoTile } from '@/components/PhotoGrid';
import { Screen } from '@/components/Screen';
import { todayKst } from '@/lib/dates';
import { compressForUpload, MAX_PHOTOS } from '@/lib/image';
import { AuthButton } from '@/features/auth/AuthButton';
import { TextButton } from '@/features/my/components';
import { colors, fonts, warm } from '@/theme';
import { ANALYZE_MESSAGES, BusyView } from './BusyView';
import { inputFooterOf, remainingSlots, type InputStep } from './stage';
import { TodayTitle } from './TodayTitle';

type Pending = { key: string; uri: string; status: 'uploading' | 'failed' };

type Props = {
  date: string;
  entry: EntryDto | null;
  categories: ChecklistCategoryDto[];
  // AI 없이 바로 직접 쓰기로
  onWriteMyself: () => void;
};

const NOTE_MAX = 200;

// 입력 단계 (화면 전체를 그린다). 두 단계로 나눠 한 번에 하나만 묻는다
//   1/2 사진(1~3장) + 한 줄 → [다음]
//   2/2 오늘 한 일 체크(선택) → [AI로 일기 만들기] → 분석
// 단계를 오가도 입력은 이 컴포넌트 상태에 남는다
export function InputStage({ date, entry, categories, onWriteMyself }: Props) {
  const [step, setStep] = useState<InputStep>(1);
  const [note, setNote] = useState(entry?.note ?? '');
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(entry?.checkedItemIds ?? []),
  );
  const [pending, setPending] = useState<Pending[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const save = useSaveEntryInput(date);
  const upload = useUploadPhoto(date);
  const removePhoto = useDeletePhoto(date);
  const analyze = useAnalyze(date);

  const uploaded = entry?.photos ?? [];
  // React Compiler가 메모이즈한다
  const tiles: PhotoTile[] = [
    ...uploaded.map((p) => ({
      key: p.id,
      uri: p.url,
      status: 'ready' as const,
    })),
    ...pending,
  ];
  const uploading = pending.filter((p) => p.status === 'uploading').length;

  const uploadOne = async (item: Pending) => {
    setPending((list) =>
      list.map((p) => (p.key === item.key ? { ...p, status: 'uploading' } : p)),
    );
    try {
      await upload.mutateAsync({ uri: item.uri });
      setPending((list) => list.filter((p) => p.key !== item.key));
    } catch (e) {
      setPending((list) =>
        list.map((p) => (p.key === item.key ? { ...p, status: 'failed' } : p)),
      );
      setNotice(errorMessage(e));
    }
  };

  const pickPhotos = async () => {
    setNotice(null);
    const slots = remainingSlots(tiles.length, MAX_PHOTOS);
    if (slots === 0) {
      setNotice(`사진은 하루 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: slots,
      quality: 1,
      exif: false,
      // iOS: HEIC 대신 JPEG 등 호환 형식으로 받는다
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    const assets = result.assets.slice(0, slots);
    if (result.assets.length > slots) {
      setNotice(
        `사진은 하루 ${MAX_PHOTOS}장까지 올릴 수 있어요. 앞의 ${slots}장만 올렸어요.`,
      );
    }
    // 압축은 한 번만 하고, 실패하면 압축본으로 다시 올린다
    const items: Pending[] = [];
    for (const asset of assets) {
      try {
        const small = await compressForUpload(
          asset.uri,
          asset.width,
          asset.height,
        );
        items.push({
          key: `${Date.now()}-${items.length}`,
          uri: small.uri,
          status: 'uploading',
        });
      } catch {
        setNotice('사진을 준비하지 못했어요. 다른 사진을 골라 주세요.');
      }
    }
    setPending((list) => [...list, ...items]);
    // 서버 순서가 고른 순서와 같도록 한 장씩 차례로 올린다
    for (const item of items) await uploadOne(item);
  };

  const remove = (key: string) => {
    setNotice(null);
    if (pending.some((p) => p.key === key)) {
      setPending((list) => list.filter((p) => p.key !== key));
      return;
    }
    removePhoto.mutate(key, { onError: (e) => setNotice(errorMessage(e)) });
  };

  const retry = (key: string) => {
    const item = pending.find((p) => p.key === key);
    if (item) void uploadOne(item);
  };

  const toggle = (itemId: string) => {
    const next = new Set(checked);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setChecked(next);
    // 체크는 바로 저장한다 (앱을 나가도 남도록)
    save.mutate({ checkedItemIds: [...next] });
  };

  const saveNote = () => {
    const value = note.trim();
    if (value === (entry?.note ?? '')) return;
    save.mutate({ note: value || null });
  };

  const startAnalyze = async () => {
    setNotice(null);
    try {
      await save.mutateAsync({
        note: note.trim() || null,
        checkedItemIds: [...checked],
      });
      await analyze.mutateAsync();
    } catch {
      // 에러는 아래 analyze.error / save.error로 보여 준다. 입력은 그대로 둔다
    }
  };

  const title = (
    <TodayTitle
      date={date}
      right={<Text style={styles.stepCount}>{step}/2</Text>}
    />
  );

  if (analyze.isPending) {
    return (
      <Screen edges={['top']} backgroundColor={warm.background}>
        <TodayTitle date={date} />
        <BusyView messages={ANALYZE_MESSAGES} />
      </Screen>
    );
  }

  const footerState = inputFooterOf(step, {
    uploaded: uploaded.length,
    uploading,
    checked: checked.size,
  });
  const actionError = analyze.error ?? save.error;
  const dayWord = date === todayKst() ? '오늘' : '이날';

  const goNext = () => {
    Keyboard.dismiss();
    saveNote();
    setStep(2);
  };

  // 시안: 아래 고정 황갈색 알약 버튼 하나 (2단계는 아무것도 안 골라도 바로 만들 수 있다)
  const footer = (
    <>
      {footerState.hint ? (
        <Text style={styles.hint}>{footerState.hint}</Text>
      ) : null}
      <AuthButton
        title={footerState.primary}
        onPress={step === 1 ? goNext : startAnalyze}
        disabled={!footerState.enabled}
        loading={step === 2 && save.isPending && !analyze.isPending}
        testID={step === 1 ? 'today-next' : 'today-analyze'}
      />
      {/* 사진·AI 없이 바로 쓰고 싶을 때. 적어 둔 한 줄은 먼저 저장한다 */}
      <TextButton
        title="AI 없이 직접 쓸게요"
        testID="today-write-myself"
        onPress={() => {
          Keyboard.dismiss();
          saveNote();
          onWriteMyself();
        }}
      />
    </>
  );

  return (
    <View style={styles.screen}>
      {/* 아래 동심원 장식 (시안). 탭바 바로 위에 붙는다 */}
      <View style={styles.decor} pointerEvents="none">
        <Image source={bottomDecor} style={styles.decorImage} />
      </View>
      {/* 단계가 바뀌면 스크롤을 맨 위에서 다시 시작한다 */}
      <Screen
        key={step}
        edges={['top']}
        footer={footer}
        backgroundColor="transparent"
        footerStyle={styles.footer}
      >
        {title}
        <View style={styles.track}>
          <View style={[styles.fill, step === 2 && styles.fillDone]} />
        </View>

        {step === 1 ? (
          <>
            <View style={[styles.card, styles.firstCard]}>
              <View style={styles.ask}>
                <Text style={styles.question}>
                  {dayWord} 찍은 사진을 골라주세요
                </Text>
                <Text style={styles.sub}>
                  1~{MAX_PHOTOS}장 사진만 골라도 AI가 일기를 써 줘요.
                </Text>
              </View>
              <PhotoGrid
                photos={tiles}
                max={MAX_PHOTOS}
                onAdd={pickPhotos}
                onRemove={remove}
                onRetry={retry}
                disabled={removePhoto.isPending}
              />
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            </View>

            <View style={styles.noteWrap}>
              <View style={styles.noteBox}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  onBlur={saveNote}
                  maxLength={NOTE_MAX}
                  placeholder="한 줄로 남기기(선택)"
                  placeholderTextColor={warm.placeholder}
                  accessibilityLabel="한 줄로 남기기 (선택)"
                  returnKeyType="done"
                  style={styles.noteInput}
                  testID="today-note"
                />
              </View>
              <Text style={styles.noteHint}>
                {note.length}/{NOTE_MAX}
                {'   '}적어 두면 AI가 더 정확히 일기를 작성할 수 있어요.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 단계로"
              hitSlop={8}
              onPress={() => setStep(1)}
              testID="today-back"
              style={({ pressed }) => [styles.backLink, pressed && styles.dim]}
            >
              <Text style={styles.backText}>{'<'} 사진, 한 줄 다시 보기</Text>
            </Pressable>

            <View style={[styles.card, styles.stepTwoCard]}>
              <View style={styles.ask}>
                <Text style={styles.question}>
                  {dayWord} 한 일을 골라주세요
                </Text>
                <Text style={styles.sub}>
                  선택사항이에요. 고르면 AI가 일기에 참고해요.
                </Text>
              </View>
              <View style={styles.box}>
                {categories.map((c) => (
                  <View key={c.id} style={styles.category}>
                    <Text style={styles.categoryName}>{c.name}</Text>
                    <View style={styles.chips}>
                      {c.items.map((item) => {
                        const on = checked.has(item.id);
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: on }}
                            onPress={() => toggle(item.id)}
                            style={[styles.chip, on && styles.chipOn]}
                          >
                            <Text
                              style={[styles.chipText, on && styles.chipTextOn]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
                {categories.length === 0 ? (
                  <Text style={styles.empty}>
                    체크리스트 항목이 없어요. 마이페이지에서 추가할 수 있어요.
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        )}

        {actionError ? (
          <Text style={styles.error} testID="today-analyze-error">
            {errorMessage(actionError)}
          </Text>
        ) : null}
      </Screen>
    </View>
  );
}

const bottomDecor = require('../../../assets/images/decor/today-bottom.png');

// 홈 카드와 같은 종이 카드
const card = {
  padding: 21,
  borderRadius: 10,
  backgroundColor: warm.field,
  shadowColor: warm.brown,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 3.5,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  // 웹은 Image의 aspectRatio를 무시해서 크기는 감싼 View가 정한다
  decor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    aspectRatio: 402 / 371,
  },
  decorImage: { width: '100%', height: '100%' },
  stepCount: { fontFamily: fonts.semibold, fontSize: 20, color: warm.brown },
  track: {
    height: 3,
    marginTop: 5,
    borderRadius: 1.5,
    backgroundColor: warm.sand,
    overflow: 'hidden',
  },
  fill: { width: '50%', height: '100%', backgroundColor: warm.ink },
  fillDone: { width: '100%' },
  card: { ...card, gap: 20 },
  firstCard: { marginTop: 37 },
  stepTwoCard: { marginTop: 9 },
  ask: { gap: 8 },
  question: { fontFamily: fonts.semibold, fontSize: 16, color: warm.black },
  sub: { fontFamily: fonts.semibold, fontSize: 13, color: warm.brown },
  notice: { fontFamily: fonts.medium, fontSize: 13, color: warm.clay },
  noteWrap: { marginTop: 2 },
  noteBox: { ...card, padding: 0, height: 45, justifyContent: 'center' },
  noteInput: {
    flex: 1,
    paddingHorizontal: 20,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: warm.ink,
  },
  noteHint: {
    marginTop: 9,
    marginLeft: 19,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: warm.tan,
  },
  backLink: { alignSelf: 'flex-start', marginTop: -4 },
  backText: { fontFamily: fonts.bold, fontSize: 13, color: warm.ink },
  box: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: warm.sand,
  },
  category: { gap: 6 },
  categoryName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: warm.brown,
    marginLeft: 3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minWidth: 52,
    height: 30,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: warm.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: warm.sand, borderColor: warm.brown },
  chipText: { fontFamily: fonts.regular, fontSize: 13, color: warm.black },
  chipTextOn: { fontFamily: fonts.semibold, color: warm.ink },
  dim: { opacity: 0.6 },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: warm.tan },
  error: { fontSize: 14, color: colors.danger },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
  },
  // 선·바탕 없이 장식 위에 버튼만 뜬다
  footer: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    paddingBottom: 19,
  },
});
