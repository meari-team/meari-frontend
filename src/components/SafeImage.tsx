import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme';

type Props = {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  // 빈 칸에 사진 아이콘을 그릴지 (위에 글자를 얹는 작은 칸은 끈다)
  showIcon?: boolean;
};

// 사진이 없거나 불러오지 못하면(서명 URL 만료 등) 회색 칸을 그린다 (prd.md §8)
export function SafeImage({
  uri,
  style,
  accessibilityLabel,
  showIcon = true,
}: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = !uri || failedUri === uri;

  if (failed) {
    return (
      <View
        style={[styles.placeholder, style]}
        accessibilityLabel={accessibilityLabel ?? '사진 없음'}
      >
        {showIcon ? (
          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
        ) : null}
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      // 크기·모서리 같은 레이아웃 스타일만 넘긴다
      style={[styles.image, style] as StyleProp<ImageStyle>}
      contentFit="cover"
      transition={150}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailedUri(uri)}
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceMuted },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
