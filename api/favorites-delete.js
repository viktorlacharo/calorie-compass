// Env vars:
// - TABLE_NAME: DynamoDB table where FAVORITE entities are stored.
//
// IAM permissions needed:
//   - dynamodb:GetItem    (to verify ownership before deleting)
//   - dynamodb:DeleteItem

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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

    const pk = `USER#${sub}`;
    const sk = `FAVORITE#${favoriteId}`;

    // Verify the item exists and belongs to this user before deleting.
    // This prevents leaking information about other users' favorites via
    // a 404 vs 403 distinction — we always 404 if not found for this user.
    const existing = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
      })
    );

    if (!existing.Item || existing.Item.entityType !== 'FAVORITE') {
      return json(404, { message: 'Favorite not found' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
      })
    );

    return json(200, { message: 'Favorite deleted successfully' });
  } catch (error) {
    console.error('favorites-delete error', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return json(500, { message: 'Internal Server Error' });
  }
};
