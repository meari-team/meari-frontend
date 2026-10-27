import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { JPEG_QUALITY, resizeTarget } from './image-size';

export { MAX_PHOTOS } from './image-size';

export type CompressedImage = { uri: string; width: number; height: number };

// 어떤 형식(HEIC 포함)이든 JPEG로 다시 저장한다. 위치 등 EXIF는 서버가 한 번 더 지운다.
export async function compressForUpload(
  uri: string,
  width: number,
  height: number,
): Promise<CompressedImage> {
  const context = ImageManipulator.manipulate(uri);
  const target = resizeTarget(width, height);
  if (target) context.resize(target);
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
