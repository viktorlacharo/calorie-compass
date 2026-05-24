import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import { ALLOWED_MEAL_LOG_SOURCES, toApiMealLog, type StoredMealLog } from '../shared/logs';
import { isNonEmptyString, isValidNumber } from '../shared/validation';

function isMacroPayload(
  value: unknown,
): value is {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    isValidNumber((value as { calories?: unknown }).calories) &&
    isValidNumber((value as { protein?: unknown }).protein) &&
    isValidNumber((value as { carbs?: unknown }).carbs) &&
    isValidNumber((value as { fats?: unknown }).fats)
  );
}

function normalizeConsumedAt(value: unknown) {
  if (!isNonEmptyString(value)) {
    return new Date().toISOString();
  }

  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) {
    return null;
  }

  return normalized.toISOString();
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

    let body: Record<string, unknown> | null = null;
    try {
      body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }

    if (!body) {
      return json(400, { message: 'Missing request body' });
    }

    const { source, total, favoriteDishId, notes, consumedAt } = body;

    if (typeof source !== 'string' || !ALLOWED_MEAL_LOG_SOURCES.includes(source as never)) {
      return json(400, { message: 'Field "source" is invalid' });
    }

    if (!isMacroPayload(total)) {
      return json(400, { message: 'Field "total" is invalid' });
    }

    if (favoriteDishId !== undefined && favoriteDishId !== null && !isNonEmptyString(favoriteDishId)) {
      return json(400, { message: 'Field "favoriteDishId" must be a non-empty string when provided' });
    }

    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return json(400, { message: 'Field "notes" must be a string when provided' });
    }

    const normalizedConsumedAt = normalizeConsumedAt(consumedAt);
    if (!normalizedConsumedAt) {
      return json(400, { message: 'Field "consumedAt" must be a valid ISO date when provided' });
    }

    const now = new Date().toISOString();
    const logId = `log_${Date.now()}`;
    const item: StoredMealLog & { PK: string; SK: string } = {
      PK: `USER#${sub}`,
      SK: `LOG#${normalizedConsumedAt}#${logId}`,
      entityType: 'MEAL_LOG',
      logId,
      userSub: sub,
      consumedAt: normalizedConsumedAt,
      source: source as StoredMealLog['source'],
      total: {
        calories: total.calories,
        protein: total.protein,
        carbs: total.carbs,
        fats: total.fats,
      },
      favoriteDishId: isNonEmptyString(favoriteDishId) ? favoriteDishId.trim() : undefined,
      notes: typeof notes === 'string' ? notes.trim() || undefined : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      }),
    );

    return json(201, { item: toApiMealLog(item) });
  } catch (error) {
    console.error('logs-create error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
