import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
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
      }),
    );

    return json(200, { items: (result.Items ?? []).map((item: unknown) => toApiFavorite(item as StoredFavorite)) });
  } catch (error) {
    console.error('favorites-list error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
