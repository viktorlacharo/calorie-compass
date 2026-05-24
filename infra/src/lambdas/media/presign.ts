import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserSub, json } from '../shared/http';
import { isNonEmptyString } from '../shared/validation';

const s3 = new S3Client({});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }

    const bucketName = process.env.MEDIA_BUCKET_NAME;
    if (!bucketName) {
      return json(500, { message: 'Missing MEDIA_BUCKET_NAME environment variable' });
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }

    if (!body) {
      return json(400, { message: 'Missing request body' });
    }

    const { fileName, contentType, pathPrefix } = body;

    if (!isNonEmptyString(fileName)) {
      return json(400, { message: 'Field "fileName" is invalid' });
    }

    if (!isNonEmptyString(contentType)) {
      return json(400, { message: 'Field "contentType" is invalid' });
    }

    if (pathPrefix !== 'meals' && pathPrefix !== 'labels') {
      return json(400, { message: 'Field "pathPrefix" must be either "meals" or "labels"' });
    }

    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const key = `private/${sub}/${pathPrefix}/${uniqueId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // Valid for 15 minutes

    return json(200, { uploadUrl, key });
  } catch (error) {
    console.error('media-presign error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
