import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import { sumMacros, toApiMealLog, type StoredMealLog } from '../shared/logs';

const DAILY_CALORIE_BUDGET = 2200;
const DAILY_PROTEIN_TARGET = 165;

function buildTodayKeyPrefix() {
  return `LOG#${new Date().toISOString().slice(0, 10)}`;
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

    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${sub}`,
          ':skPrefix': buildTodayKeyPrefix(),
        },
        ScanIndexForward: false,
      }),
    );

    const entries = (result.Items ?? []).map((item) => toApiMealLog(item as StoredMealLog));
    const totals = sumMacros(entries);

    return json(200, {
      entries,
      totals,
      budget: DAILY_CALORIE_BUDGET,
      remainingCalories: Math.max(0, DAILY_CALORIE_BUDGET - totals.calories),
      remainingProtein: Math.max(0, DAILY_PROTEIN_TARGET - totals.protein),
    });
  } catch (error) {
    console.error('logs-dashboard error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
