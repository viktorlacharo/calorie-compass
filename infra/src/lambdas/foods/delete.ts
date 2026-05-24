import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import type { StoredFavorite } from '../shared/favorites';

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

    // 1. Verificar si el alimento existe antes de hacer nada
    const foodResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FOOD#${foodId}`,
        },
      }),
    );

    if (!foodResult.Item || foodResult.Item.entityType !== 'FOOD') {
      return json(404, { message: 'Food not found' });
    }

    // 2. Buscar si hay recetas favoritas asociadas a este alimento
    const favoritesResult = await docClient.send(
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
      }),
    );

    const favorites = (favoritesResult.Items ?? []) as StoredFavorite[];
    const recipesUsingFood = favorites.filter((fav) =>
      fav.items?.some((item) => item.foodId === foodId)
    );

    // 3. Si hay recetas que usan este alimento, bloquear el borrado e informar cuáles son
    if (recipesUsingFood.length > 0) {
      return json(200, {
        status: 'blocked',
        recipeCount: recipesUsingFood.length,
        recipes: recipesUsingFood.map((fav) => ({
          id: fav.favoriteId,
          name: fav.name,
        })),
      });
    }

    // 4. Si no tiene dependencias, borrar de DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          PK: `USER#${sub}`,
          SK: `FOOD#${foodId}`,
        },
      }),
    );

    return json(200, { status: 'deleted' });
  } catch (error) {
    console.error('foods-delete error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
