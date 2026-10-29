import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fonts, warm } from '@/theme';

export type PhotoTile = {
  key: string;
  uri: string;
  status?: 'ready' | 'uploading' | 'failed';
};

type Props = {
  photos: PhotoTile[];
  max: number;
  onAdd?: () => void; // 없으면 빈 칸을 그리지 않는다 (보기 모드)
  onRemove?: (key: string) => void;
  onRetry?: (key: string) => void;
  disabled?: boolean;
};

// 정사각형 사진 칸을 한 줄에 max개 (시안: 3칸). 빈 칸을 누르면 사진을 고른다.
// 업로드 중·실패 상태를 사진 위에 함께 그린다
export function PhotoGrid({
  photos,
  max,
  onAdd,
  onRemove,
  onRetry,
  disabled,
}: Props) {
  const empty = onAdd ? Math.max(0, max - photos.length) : 0;
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
              <ActivityIndicator color={warm.field} />
            </View>
          ) : null}
          {p.status === 'failed' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 다시 올리기"
              style={[styles.overlay, styles.failed]}
              onPress={() => onRetry?.(p.key)}
            >
              <Ionicons name="refresh" size={20} color={warm.field} />
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
              <Ionicons name="close" size={13} color={warm.field} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <Pressable
          key={`empty-${i}`}
          accessibilityRole="button"
          accessibilityLabel="사진 고르기"
          testID={i === 0 ? 'today-pick-photos' : undefined}
          disabled={disabled}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.tile,
            styles.empty,
            (pressed || disabled) && styles.dim,
          ]}
        >
          <Text style={styles.plus}>+</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 11 },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: warm.background,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'rgba(74,52,42,0.35)',
  },
  failed: { backgroundColor: 'rgba(198,90,78,0.7)' },
  overlayText: { fontFamily: fonts.semibold, fontSize: 11, color: warm.field },
  remove: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,52,42,0.6)',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,201,184,0.35)',
  },
  plus: { fontFamily: fonts.regular, fontSize: 28, color: warm.tan },
  dim: { opacity: 0.6 },
});
