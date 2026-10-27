import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { PhotoDto } from '@/api/entries';
import { SafeImage } from '@/components/SafeImage';
import { colors, radius, spacing } from '@/theme';

// 일기 상세의 사진 넘겨보기 (한 장씩 가로로)
export function PhotoCarousel({ photos }: { photos: PhotoDto[] }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {photos.map((p, i) => (
            <View key={p.id} style={{ width }}>
              <SafeImage
                uri={p.url}
                style={[styles.image, { width }]}
                accessibilityLabel={p.caption ?? `사진 ${i + 1}`}
              />
              {p.caption ? (
                <Text style={styles.caption}>{p.caption}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <View
              key={p.id}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  image: { aspectRatio: 4 / 3, borderRadius: radius.md },
  caption: { marginTop: spacing.xs, fontSize: 13, color: colors.textMuted },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
});
