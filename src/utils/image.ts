import * as ImageManipulator from "expo-image-manipulator";

const MAX_WIDTH = 1280;
const COMPRESS_QUALITY = 0.75;

export type CompressedImage = {
  uri: string;
  mimeType: string;
};

export async function compressImageForUpload(
  uri: string,
  originalMimeType?: string,
): Promise<CompressedImage> {
  const actions: ImageManipulator.Action[] = [{ resize: { width: MAX_WIDTH } }];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: result.uri, mimeType: "image/jpeg" };
}
