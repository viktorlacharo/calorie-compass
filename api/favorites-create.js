// Env vars:
// - TABLE_NAME: DynamoDB table where FOOD and FAVORITE entities are stored.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ALLOWED_DIFFICULTIES = ['Facil', 'Media', 'Alta'];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isFavoriteItemsArray(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        isNonEmptyString(item.foodId) &&
        isValidNumber(item.quantity) &&
        item.quantity > 0
    )
  );
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

async function assertFoodsExist(tableName, sub, items) {
  for (const item of items) {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FOOD#${item.foodId}`,
        },
      })
    );

    if (!result.Item || result.Item.entityType !== 'FOOD') {
      return item.foodId;
    }
  }

  return null;
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

    let body = null;
    try {
      body = event?.body ? JSON.parse(event.body) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }

    if (!body || typeof body !== 'object') {
      return json(400, { message: 'Missing request body' });
    }

    const {
      name,
      description,
      imageUri,
      prepMinutes,
      difficulty,
      servings,
      tags,
      steps,
      items,
    } = body;

    if (!isNonEmptyString(name)) {
      return json(400, { message: 'Field "name" is required' });
    }

    if (!isNonEmptyString(description)) {
      return json(400, { message: 'Field "description" is required' });
    }

    if (!isNonEmptyString(imageUri)) {
      return json(400, { message: 'Field "imageUri" is required' });
    }

    if (!isValidNumber(prepMinutes) || prepMinutes < 0) {
      return json(400, { message: 'Field "prepMinutes" must be a valid number greater than or equal to 0' });
    }

    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return json(400, { message: 'Field "difficulty" is invalid' });
    }

    if (!isValidNumber(servings) || servings <= 0) {
      return json(400, { message: 'Field "servings" must be a valid number greater than 0' });
    }

    if (!isStringArray(tags)) {
      return json(400, { message: 'Field "tags" must be an array of strings' });
    }

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

    const item = {
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

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return json(201, { item: toApiFavorite(item) });
  } catch (error) {
    console.error('favorites-create error', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return json(500, { message: 'Internal Server Error' });
  }
};
