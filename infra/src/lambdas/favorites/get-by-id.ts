import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { toApiFavorite, type StoredFavorite } from '../shared/favorites';
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

    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FAVORITE#${favoriteId}`,
        },
      }),
    );

    const item = result.Item as StoredFavorite | undefined;
    if (!item || item.entityType !== 'FAVORITE') {
      return json(404, { message: 'Favorite not found' });
    }

    return json(200, { item: toApiFavorite(item) });
  } catch (error) {
    console.error('favorites-get-by-id error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
