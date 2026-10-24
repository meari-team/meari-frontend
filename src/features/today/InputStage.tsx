import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { Section } from '@/components/Section';
import { ScheduleList } from '@/features/schedules/ScheduleList';
import { TextField } from '@/components/TextField';
import { compressForUpload, MAX_PHOTOS } from '@/lib/image';
import { colors, spacing } from '@/theme';
import { ANALYZE_MESSAGES, BusyView } from './BusyView';
import { canAnalyze, remainingSlots } from './stage';

type Pending = { key: string; uri: string; status: 'uploading' | 'failed' };

type Props = {
  date: string;
  entry: EntryDto | null;
  categories: ChecklistCategoryDto[];
};

const NOTE_MAX = 200;

// 1단계: 사진(1~3장) + 한 줄 설명 + 체크리스트 → 분석하기
export function InputStage({ date, entry, categories }: Props) {
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

  if (analyze.isPending) return <BusyView messages={ANALYZE_MESSAGES} />;

  const ready = canAnalyze({ uploaded: uploaded.length, uploading });
  const actionError = analyze.error ?? save.error;

  return (
    <View style={styles.wrap}>
      <Section
        title="오늘의 사진"
        hint={`1~${MAX_PHOTOS}장. 사진만 골라도 AI가 일기를 써 줘요.`}
      >
        <PhotoGrid
          photos={tiles}
          max={MAX_PHOTOS}
          onAdd={pickPhotos}
          onRemove={remove}
          onRetry={retry}
          disabled={removePhoto.isPending}
        />
      </Section>

      <ScheduleList
        date={date}
        title="이 날 일정"
        hint="AI가 일기를 쓸 때 참고해요. 캘린더에서 추가·수정할 수 있어요."
        emptyText="등록한 일정이 없어요."
      />

      <Section title="한 줄 설명" hint="선택 — 적어 두면 AI가 덜 헷갈려요">
        <TextField
          label="오늘은 어떤 날이었나요?"
          value={note}
          onChangeText={setNote}
          onBlur={saveNote}
          maxLength={NOTE_MAX}
          placeholder="예: 중간고사 끝나고 친구랑 파스타"
          hint={`${note.length}/${NOTE_MAX}`}
          testID="today-note"
        />
      </Section>

      <Section title="오늘의 체크리스트" hint="선택">
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
      </Section>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {actionError ? (
        <Text style={styles.error} testID="today-analyze-error">
          {errorMessage(actionError)}
        </Text>
      ) : null}

      <Button
        title={uploading > 0 ? '사진을 올리는 중…' : '일기 만들기 시작'}
        onPress={startAnalyze}
        disabled={!ready}
        loading={save.isPending && !analyze.isPending}
      />
      {uploaded.length === 0 && uploading === 0 ? (
        <Text style={styles.hint}>사진을 1장 이상 올려 주세요.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  category: { gap: spacing.xs + 2 },
  categoryName: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { fontSize: 14, color: colors.warning },
  error: { fontSize: 14, color: colors.danger },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
