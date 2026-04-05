// Env vars:
// - TABLE_NAME: DynamoDB table where FAVORITE entities are stored.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :favoritePrefix)',
        FilterExpression: '#entityType = :entityType',
        ExpressionAttributeNames: {
          '#pk': 'PK',
          '#sk': 'SK',
          '#entityType': 'entityType',
        },
        ExpressionAttributeValues: {
          ':pk': `USER#${sub}`,
          ':favoritePrefix': 'FAVORITE#',
          ':entityType': 'FAVORITE',
        },
        ScanIndexForward: false,
      })
    );

    const items = (result.Items ?? []).map(toApiFavorite);
    return json(200, { items });
  } catch (error) {
    console.error('favorites-list error', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return json(500, { message: 'Internal Server Error' });
  }
};
