import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { toApiFavorite, type StoredFavorite } from '../shared/favorites';
import { getUserSub, json } from '../shared/http';
import {
  ALLOWED_DIFFICULTIES,
  isNonEmptyString,
  isStringArray,
  isValidNumber,
} from '../shared/validation';

function isFavoriteItemsArray(value: unknown): value is Array<{ foodId: string; quantity: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        isNonEmptyString((item as { foodId?: unknown }).foodId) &&
        isValidNumber((item as { quantity?: unknown }).quantity) &&
        (item as { quantity: number }).quantity > 0,
    )
  );
}

async function assertFoodsExist(tableName: string, sub: string, items: Array<{ foodId: string; quantity: number }>) {
  for (const item of items) {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FOOD#${item.foodId}`,
        },
      }),
    );

    if (!result.Item || (result.Item as { entityType?: string }).entityType !== 'FOOD') {
      return item.foodId;
    }
  }

  return null;
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

    const { name, description, imageUri, prepMinutes, difficulty, servings, tags, steps, items } = body;

    if (!isNonEmptyString(name)) return json(400, { message: 'Field "name" is required' });
    if (!isNonEmptyString(description)) return json(400, { message: 'Field "description" is required' });
    if (!isNonEmptyString(imageUri)) return json(400, { message: 'Field "imageUri" is required' });
    if (!isValidNumber(prepMinutes) || prepMinutes < 0) {
      return json(400, { message: 'Field "prepMinutes" must be a valid number greater than or equal to 0' });
    }
    if (typeof difficulty !== 'string' || !ALLOWED_DIFFICULTIES.includes(difficulty as never)) {
      return json(400, { message: 'Field "difficulty" is invalid' });
    }
    if (!isValidNumber(servings) || servings <= 0) {
      return json(400, { message: 'Field "servings" must be a valid number greater than 0' });
    }
    if (!isStringArray(tags)) return json(400, { message: 'Field "tags" must be an array of strings' });
    if (!isStringArray(steps) || steps.length === 0) {
      return json(400, { message: 'Field "steps" must be a non-empty array of strings' });
    }
    if (!isFavoriteItemsArray(items) || items.length === 0) {
      return json(400, { message: 'Field "items" must be a non-empty array of recipe items' });
    }

    const missingFoodId = await assertFoodsExist(tableName, sub, items);
    if (missingFoodId) {
      return json(400, { message: `Referenced food not found: ${missingFoodId}` });
    }

    const now = new Date().toISOString();
    const favoriteId = `dish_${Date.now()}`;
    const item: StoredFavorite & { PK: string; SK: string } = {
      PK: `USER#${sub}`,
      SK: `FAVORITE#${favoriteId}`,
      entityType: 'FAVORITE',
      favoriteId,
      userSub: sub,
      name: name.trim(),
      description: description.trim(),
      imageUri: imageUri.trim(),
      prepMinutes,
      difficulty,
      servings,
      tags: tags.map((tag) => tag.trim()).filter(Boolean),
      steps: steps.map((step) => step.trim()).filter(Boolean),
      items: items.map((recipeItem) => ({
        foodId: recipeItem.foodId.trim(),
        quantity: recipeItem.quantity,
      })),
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    return json(201, { item: toApiFavorite(item) });
  } catch (error) {
    console.error('favorites-create error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
