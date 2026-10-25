import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

// 광고 자리. 지금은 자리 표시만 하고, 실제 광고가 생기면 이미지·문구·눌렀을 때 동작을 넘긴다.
// 광고임을 알 수 있게 "광고" 표시는 항상 보인다
export function AdSlot({
  imageUri,
  title = '이 자리에 광고가 들어가요',
  body = '메아리와 함께할 파트너를 기다리고 있어요.',
  onPress,
}: {
  imageUri?: string;
  title?: string;
  body?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>광고 이미지</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
      </View>
      <Text style={styles.badge} accessibilityLabel="광고">
        광고
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.card} testID="ad-slot">
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID="ad-slot"
      accessibilityRole="link"
      accessibilityLabel={`광고, ${title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 16 / 9 },
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, color: colors.disabled },
  text: { padding: spacing.md, gap: spacing.xs },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
    backgroundColor: 'rgba(31, 29, 26, 0.55)',
  },
});
