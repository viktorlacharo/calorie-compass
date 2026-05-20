import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }

    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      return json(500, { message: 'Missing TABLE_NAME environment variable' });
    }

    const favoriteId = event.pathParameters?.id?.trim();
    if (!favoriteId) {
      return json(400, { message: 'Missing favorite id path parameter' });
    }

    const PK = `USER#${sub}`;
    const SK = `FAVORITE#${favoriteId}`;

    const existing = await docClient.send(new GetCommand({ TableName: tableName, Key: { PK, SK } }));
    if (!existing.Item || (existing.Item as { entityType?: string }).entityType !== 'FAVORITE') {
      return json(404, { message: 'Favorite not found' });
    }

    await docClient.send(new DeleteCommand({ TableName: tableName, Key: { PK, SK } }));
    return json(200, { message: 'Favorite deleted successfully' });
  } catch (error) {
    console.error('favorites-delete error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
