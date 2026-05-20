import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { toApiFood, type StoredFood } from '../shared/foods';
import { getUserSub, json } from '../shared/http';
import { ALLOWED_SUPERMARKETS, isValidNumber, normalizeBarcode } from '../shared/validation';

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

    const name = body.name;
    const rawBarcode = body.barcode;
    const brand = body.brand;
    const referenceAmount = body.referenceAmount ?? 100;
    const referenceMacros = body.referenceMacros as Record<string, unknown> | undefined;
    const defaultServingAmount = body.defaultServingAmount;
    const supermarket = body.supermarket ?? null;

    if (typeof name !== 'string' || !name.trim()) {
      return json(400, { message: 'Field "name" is required' });
    }

    if (!isValidNumber(referenceAmount) || referenceAmount <= 0) {
      return json(400, { message: 'Field "referenceAmount" must be a number greater than 0' });
    }

    const barcode = rawBarcode === undefined ? null : normalizeBarcode(rawBarcode);
    if (rawBarcode !== undefined && barcode === null) {
      return json(400, { message: 'Field "barcode" must be digits only with length 8, 12 or 13' });
    }

    if (brand !== undefined && brand !== null && (typeof brand !== 'string' || !brand.trim())) {
      return json(400, { message: 'Field "brand" must be a non-empty string when provided' });
    }

    if (!referenceMacros || typeof referenceMacros !== 'object') {
      return json(400, { message: 'Field "referenceMacros" is required' });
    }

    const calories = referenceMacros.calories;
    const protein = referenceMacros.protein;
    const carbs = referenceMacros.carbs;
    const fats = referenceMacros.fats;
    if (!isValidNumber(calories) || !isValidNumber(protein) || !isValidNumber(carbs) || !isValidNumber(fats)) {
      return json(400, {
        message: 'referenceMacros.calories, protein, carbs and fats must be valid numbers',
      });
    }

    if (defaultServingAmount !== undefined && (!isValidNumber(defaultServingAmount) || defaultServingAmount <= 0)) {
      return json(400, { message: 'Field "defaultServingAmount" must be a number greater than 0 when provided' });
    }

    if (supermarket !== null && supermarket !== undefined && (typeof supermarket !== 'string' || !ALLOWED_SUPERMARKETS.includes(supermarket as never))) {
      return json(400, { message: 'Field "supermarket" is invalid' });
    }

    if (barcode) {
      const existingResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :foodPrefix)',
          FilterExpression: '#barcode = :barcode',
          ExpressionAttributeNames: {
            '#pk': 'PK',
            '#sk': 'SK',
            '#barcode': 'barcode',
          },
          ExpressionAttributeValues: {
            ':pk': `USER#${sub}`,
            ':foodPrefix': 'FOOD#',
            ':barcode': barcode,
          },
        }),
      );

      const existing = existingResult.Items?.[0] as StoredFood | undefined;
      if (existing) {
        return json(409, {
          message: 'A food with this barcode already exists for this user',
          barcode,
          existingFoodId: existing.foodId,
          existingFoodName: existing.name,
        });
      }
    }

    const now = new Date().toISOString();
    const foodId = `food_${Date.now()}`;
    const item: StoredFood & { PK: string; SK: string } = {
      PK: `USER#${sub}`,
      SK: `FOOD#${foodId}`,
      entityType: 'FOOD',
      foodId,
      userSub: sub,
      name: name.trim(),
      referenceAmount,
      referenceUnit: 'g',
      referenceMacros: { calories, protein, carbs, fats },
      createdAt: now,
      updatedAt: now,
      ...(barcode ? { barcode } : {}),
      ...(typeof brand === 'string' && brand.trim() ? { brand: brand.trim() } : {}),
      ...(defaultServingAmount !== undefined ? { defaultServingAmount } : {}),
      ...(typeof supermarket === 'string' ? { supermarket } : {}),
    };

    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    return json(201, { item: toApiFood(item) });
  } catch (error) {
    console.error('foods-create error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
