import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import { toApiMealLog, type StoredMealLog } from '../shared/logs';

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const t = Date.parse(value);
  return !Number.isNaN(t);
}

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

    const queryParams = event.queryStringParameters ?? {};
    const { startDate, endDate } = queryParams;

    if (!startDate || !isValidIsoDate(startDate)) {
      return json(400, { message: 'Query parameter "startDate" is missing or invalid' });
    }

    if (!endDate || !isValidIsoDate(endDate)) {
      return json(400, { message: 'Query parameter "endDate" is missing or invalid' });
    }

    const startIso = new Date(startDate).toISOString();
    const endIso = new Date(endDate).toISOString();

    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND SK BETWEEN :startSk AND :endSk',
        ExpressionAttributeValues: {
          ':pk': `USER#${sub}`,
          ':startSk': `LOG#${startIso}`,
          ':endSk': `LOG#${endIso}`,
        },
        ScanIndexForward: false, // Descending order of consumedAt
      }),
    );

    const items = (result.Items ?? []).map((item) => toApiMealLog(item as StoredMealLog));

    return json(200, { items });
  } catch (error) {
    console.error('logs-list error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
