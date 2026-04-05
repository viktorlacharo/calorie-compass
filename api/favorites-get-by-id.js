// Env vars:
// - TABLE_NAME: DynamoDB table where FAVORITE entities are stored.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function toApiFavorite(stored) {
  return {
    id: stored.favoriteId,
    userId: stored.userSub,
    name: stored.name,
    description: stored.description,
    imageUri: stored.imageUri,
    prepMinutes: stored.prepMinutes,
    difficulty: stored.difficulty,
    servings: stored.servings,
    tags: stored.tags ?? [],
    steps: stored.steps ?? [],
    items: stored.items ?? [],
    createdAt: stored.createdAt,
  };
}

export const handler = async (event) => {
  try {
    const claims = event?.requestContext?.authorizer?.jwt?.claims ?? {};
    const sub = claims.sub;

    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }

    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      return json(500, { message: 'Missing TABLE_NAME environment variable' });
    }

    const favoriteId = event?.pathParameters?.id?.trim();
    if (!favoriteId) {
      return json(400, { message: 'Missing favorite id path parameter' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FAVORITE#${favoriteId}`,
        },
      })
    );

    if (!result.Item || result.Item.entityType !== 'FAVORITE') {
      return json(404, { message: 'Favorite not found' });
    }

    return json(200, { item: toApiFavorite(result.Item) });
  } catch (error) {
    console.error('favorites-get-by-id error', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return json(500, { message: 'Internal Server Error' });
  }
};
