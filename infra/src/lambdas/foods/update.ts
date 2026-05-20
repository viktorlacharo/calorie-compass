import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { toApiFood, type StoredFood } from '../shared/foods';
import { getUserSub, json } from '../shared/http';
import { ALLOWED_SUPERMARKETS, isValidNumber, normalizeBarcode } from '../shared/validation';

async function findExistingFoodByBarcode(tableName: string, sub: string, barcode: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :foodPrefix)',
      FilterExpression: '#entityType = :entityType AND #barcode = :barcode',
      ExpressionAttributeNames: {
        '#pk': 'PK',
        '#sk': 'SK',
        '#entityType': 'entityType',
        '#barcode': 'barcode',
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${sub}`,
        ':foodPrefix': 'FOOD#',
        ':entityType': 'FOOD',
        ':barcode': barcode,
      },
    }),
  );

  return (result.Items?.[0] as StoredFood | undefined) ?? null;
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

    const foodId = event.pathParameters?.id?.trim();
    if (!foodId) {
      return json(400, { message: 'Missing food id path parameter' });
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
    const referenceAmount = body.referenceAmount;
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

    const existingFoodResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FOOD#${foodId}`,
        },
      }),
    );

    const existingFood = existingFoodResult.Item as (StoredFood & { PK: string; SK: string }) | undefined;
    if (!existingFood || existingFood.entityType !== 'FOOD') {
      return json(404, { message: 'Food not found' });
    }

    if (barcode) {
      const duplicate = await findExistingFoodByBarcode(tableName, sub, barcode);
      if (duplicate && duplicate.foodId !== foodId) {
        return json(409, {
          message: 'A food with this barcode already exists for this user',
          barcode,
          existingFoodId: duplicate.foodId,
          existingFoodName: duplicate.name,
        });
      }
    }

    const updatedItem: StoredFood & { PK: string; SK: string } = {
      ...existingFood,
      name: name.trim(),
      referenceAmount,
      referenceUnit: 'g',
      referenceMacros: { calories, protein, carbs, fats },
      updatedAt: new Date().toISOString(),
    };

    if (barcode) {
      updatedItem.barcode = barcode;
    } else {
      delete updatedItem.barcode;
    }
    if (typeof brand === 'string' && brand.trim()) {
      updatedItem.brand = brand.trim();
    } else {
      delete updatedItem.brand;
    }
    if (defaultServingAmount !== undefined) {
      updatedItem.defaultServingAmount = defaultServingAmount;
    } else {
      delete updatedItem.defaultServingAmount;
    }
    if (typeof supermarket === 'string') {
      updatedItem.supermarket = supermarket;
    } else {
      delete updatedItem.supermarket;
    }

    await docClient.send(new PutCommand({ TableName: tableName, Item: updatedItem }));
    return json(200, { item: toApiFood(updatedItem) });
  } catch (error) {
    console.error('foods-update error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
