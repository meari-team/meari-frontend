import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useAnalyze,
  useDeletePhoto,
  useSaveEntryInput,
  useUploadPhoto,
  type ChecklistCategoryDto,
  type EntryDto,
} from '@/api/entries';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { PhotoGrid, type PhotoTile } from '@/components/PhotoGrid';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useDaySchedules } from '@/api/schedules';
import { todayKst } from '@/lib/dates';
import { compressForUpload, MAX_PHOTOS } from '@/lib/image';
import { colors, radius, spacing } from '@/theme';
import { ANALYZE_MESSAGES, BusyView } from './BusyView';
import { inputFooterOf, remainingSlots, type InputStep } from './stage';
import { TodayTitle } from './TodayTitle';

type Pending = { key: string; uri: string; status: 'uploading' | 'failed' };

type Props = {
  date: string;
  entry: EntryDto | null;
  categories: ChecklistCategoryDto[];
};

const NOTE_MAX = 200;

// 입력 단계 (화면 전체를 그린다). 두 단계로 나눠 한 번에 하나만 묻는다
//   1/2 사진(1~3장) + 한 줄 + 그날 일정 한 줄 → [다음]
//   2/2 오늘 한 일 체크(선택) → [AI로 일기 만들기] → 분석
// 단계를 오가도 입력은 이 컴포넌트 상태에 남는다
export function InputStage({ date, entry, categories }: Props) {
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
      right={<Text style={styles.stepCount}>{step} / 2</Text>}
    />
  );

  if (analyze.isPending) {
    return (
      <Screen edges={['top']}>
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

  const footer = (
    <>
      {footerState.hint ? (
        <Text style={styles.hint}>{footerState.hint}</Text>
      ) : null}
      <View style={styles.footerRow}>
        {footerState.skip ? (
          <View style={styles.skip}>
            <Button
              title="건너뛰기"
              variant="ghost"
              onPress={startAnalyze}
              testID="today-skip"
            />
          </View>
        ) : null}
        <View style={styles.primary}>
          <Button
            title={footerState.primary}
            onPress={step === 1 ? goNext : startAnalyze}
            disabled={!footerState.enabled}
            loading={step === 2 && save.isPending && !analyze.isPending}
            testID={step === 1 ? 'today-next' : 'today-analyze'}
          />
        </View>
      </View>
    </>
  );

  return (
    // 단계가 바뀌면 스크롤을 맨 위에서 다시 시작한다
    <Screen key={step} edges={['top']} footer={footer}>
      {title}
      <View style={styles.track}>
        <View style={[styles.fill, step === 2 && styles.fillDone]} />
      </View>

      {step === 1 ? (
        <>
          <View style={styles.ask}>
            <Text style={styles.question}>
              {dayWord} 찍은 사진을 골라 주세요
            </Text>
            <Text style={styles.sub}>
              1~{MAX_PHOTOS}장. 사진만 골라도 AI가 일기를 써 줘요.
            </Text>
          </View>

          {tiles.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 고르기"
              onPress={pickPhotos}
              testID="today-pick-photos"
              style={({ pressed }) => [styles.hero, pressed && styles.dim]}
            >
              <Ionicons name="add" size={36} color={colors.primary} />
              <Text style={styles.heroText}>사진 고르기</Text>
              <Text style={styles.heroCount}>0/{MAX_PHOTOS}</Text>
            </Pressable>
          ) : (
            <PhotoGrid
              photos={tiles}
              max={MAX_PHOTOS}
              onAdd={pickPhotos}
              onRemove={remove}
              onRetry={retry}
              disabled={removePhoto.isPending}
            />
          )}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <TextField
            label="한 줄로 남기기 (선택)"
            value={note}
            onChangeText={setNote}
            onBlur={saveNote}
            maxLength={NOTE_MAX}
            placeholder="예: 중간고사 끝나고 친구랑 파스타"
            returnKeyType="done"
            hint={`${note.length}/${NOTE_MAX} · 적어 두면 AI가 덜 헷갈려요`}
            testID="today-note"
          />

          <ScheduleLine date={date} dayWord={dayWord} />
        </>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 단계로"
            hitSlop={8}
            onPress={() => setStep(1)}
            testID="today-back"
            style={styles.backLink}
          >
            <Text style={styles.backText}>‹ 사진·한 줄 다시 보기</Text>
          </Pressable>
          <View style={styles.ask}>
            <Text style={styles.question}>{dayWord} 한 일을 골라 주세요</Text>
            <Text style={styles.sub}>
              선택이에요. 고르면 AI가 일기에 참고해요.
            </Text>
          </View>

          <View style={styles.card}>
            {categories.map((c) => (
              <View key={c.id} style={styles.category}>
                <Text style={styles.categoryName}>{c.name}</Text>
                <View style={styles.chips}>
                  {c.items.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      color={c.color}
                      selected={checked.has(item.id)}
                      onPress={() => toggle(item.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
            {categories.length === 0 ? (
              <Text style={styles.sub}>
                체크리스트 항목이 없어요. 마이페이지에서 추가할 수 있어요.
              </Text>
            ) : null}
          </View>
        </>
      )}

      {actionError ? (
        <Text style={styles.error} testID="today-analyze-error">
          {errorMessage(actionError)}
        </Text>
      ) : null}
    </Screen>
  );
}

// 그날 일정은 카드 대신 한 줄로 (AI가 참고한다). 없으면 그리지 않는다
function ScheduleLine({ date, dayWord }: { date: string; dayWord: string }) {
  const list = useDaySchedules(date);
  const items = list.data ?? [];
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  return (
    <View style={styles.schedule} testID="today-schedule-line">
      <Text style={styles.scheduleText} numberOfLines={1}>
        <Text style={styles.scheduleLabel}>{dayWord} 일정 · </Text>
        {first.time ? `${first.time} ` : ''}
        {first.title}
        {rest.length > 0 ? ` 외 ${rest.length}개` : ''}
      </Text>
      <Text style={styles.scheduleHint}>AI가 일기를 쓸 때 참고해요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepCount: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { width: '50%', height: '100%', backgroundColor: colors.primary },
  fillDone: { width: '100%' },
  ask: { gap: spacing.xs, marginTop: spacing.sm },
  question: { fontSize: 20, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  hero: {
    height: 200,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroText: { fontSize: 16, fontWeight: '600', color: colors.text },
  heroCount: { fontSize: 13, color: colors.textMuted },
  dim: { opacity: 0.7 },
  schedule: { gap: 2 },
  scheduleText: { fontSize: 15, color: colors.text },
  scheduleLabel: { fontWeight: '600', color: colors.textMuted },
  scheduleHint: { fontSize: 12, color: colors.textMuted },
  backLink: { alignSelf: 'flex-start', marginTop: spacing.xs },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  category: { gap: spacing.xs + 2 },
  categoryName: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { fontSize: 14, color: colors.warning },
  error: { fontSize: 14, color: colors.danger },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  skip: { flex: 1 },
  primary: { flex: 2 },
});
