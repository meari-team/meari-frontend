import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing } from '@/theme';

export type PhotoTile = {
  key: string;
  uri: string;
  status?: 'ready' | 'uploading' | 'failed';
};

type Props = {
  photos: PhotoTile[];
  max: number;
  onAdd?: () => void; // 없으면 추가 칸을 그리지 않는다 (보기 모드)
  onRemove?: (key: string) => void;
  onRetry?: (key: string) => void;
  disabled?: boolean;
};

// 정사각형 사진 칸. 업로드 중·실패 상태와 추가 칸을 함께 그린다
export function PhotoGrid({
  photos,
  max,
  onAdd,
  onRemove,
  onRetry,
  disabled,
}: Props) {
  const canAdd = !!onAdd && photos.length < max;
  return (
    <View style={styles.grid}>
      {photos.map((p) => (
        <View key={p.key} style={styles.tile}>
          <Image
            source={{ uri: p.uri }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
          {p.status === 'uploading' ? (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
          {p.status === 'failed' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 다시 올리기"
              style={[styles.overlay, styles.failed]}
              onPress={() => onRetry?.(p.key)}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.overlayText}>다시 올리기</Text>
            </Pressable>
          ) : null}
          {onRemove && p.status !== 'uploading' && !disabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 빼기"
              hitSlop={8}
              style={styles.remove}
              onPress={() => onRemove(p.key)}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      ))}
      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 추가"
          disabled={disabled}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.tile,
            styles.add,
            (pressed || disabled) && styles.dim,
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textMuted} />
          <Text style={styles.addText}>
            {photos.length}/{max}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  failed: { backgroundColor: 'rgba(209,67,67,0.65)' },
  overlayText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addText: { fontSize: 12, color: colors.textMuted },
  dim: { opacity: 0.6 },
});
