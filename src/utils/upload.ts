import { getUploadPresignUrl } from '@/lib/api/generated/aws-api';
import * as FileSystem from 'expo-file-system';

/**
 * Uploads an image file from the React Native / Expo local filesystem to the private S3 bucket.
 * 
 * @param imageUri Local file URI (e.g. file:///path/to/image.jpg)
 * @param pathPrefix Directory prefix ('meals' or 'labels')
 * @returns The unique S3 key for the uploaded image
 */
export async function uploadImageToS3(
  imageUri: string,
  pathPrefix: 'meals' | 'labels'
): Promise<string> {
  const fileName = imageUri.split('/').pop() || `photo_${Date.now()}.jpg`;

  // Determine content type based on extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  let contentType = 'image/jpeg';
  if (extension === 'png') {
    contentType = 'image/png';
  } else if (extension === 'webp') {
    contentType = 'image/webp';
  }

  // 1. Fetch presigned S3 upload URL from Backend Lambda
  const response = await getUploadPresignUrl({
    fileName,
    contentType,
    pathPrefix,
  });

  const { uploadUrl, key } = response;

  // 2. Perform raw binary PUT upload to S3
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, imageUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.UploadType.BINARY_CONTENT as any,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`S3 upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
  }

  return key;
}


