import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';

type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Food = {
  id: string;
  name: string;
  referenceAmount: number;
  defaultServingAmount?: number | null;
  referenceMacros: MacroNutrients;
  supermarket?: string | null;
  brand?: string | null;
  barcode?: string | null;
};

type FavoriteDishItem = {
  foodId: string;
  quantity: number;
};

type FavoriteDish = {
  id: string;
  name: string;
  description: string;
  imageUri: string;
  prepMinutes: number;
  difficulty: 'Facil' | 'Media' | 'Alta';
  servings: number;
  tags: string[];
  steps: string[];
  items: FavoriteDishItem[];
};

type MealSuggestionMode = 'craving' | 'recommended' | 'alternate';
type MealSuggestionFocus = 'quick' | 'protein' | 'snack' | 'light-dinner' | 'dessert-fit';

type MealSuggestion = {
  id: string;
  title: string;
  description: string;
  whyItFits: string;
  estimatedCalories: number;
  estimatedMacros: MacroNutrients;
  items: FavoriteDishItem[];
  foodNames: string[];
  sourceKind: 'foods-only' | 'favorite-adaptation';
  sourceLabel: string;
  basedOnFavoriteId?: string;
};

function getFoodDefaultServingAmount(food: Pick<Food, 'defaultServingAmount' | 'referenceAmount'>) {
  return food.defaultServingAmount ?? food.referenceAmount;
}

function calculateServingMacros(
  referenceMacros: MacroNutrients,
  referenceAmount: number,
  servingAmount: number,
): MacroNutrients {
  if (referenceAmount <= 0 || servingAmount <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  const factor = servingAmount / referenceAmount;

  return {
    calories: Math.round(referenceMacros.calories * factor),
    protein: Number((referenceMacros.protein * factor).toFixed(1)),
    carbs: Number((referenceMacros.carbs * factor).toFixed(1)),
    fats: Number((referenceMacros.fats * factor).toFixed(1)),
  };
}

function sumMacros(items: MacroNutrients[]): MacroNutrients {
  return items.reduce<MacroNutrients>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Number((acc.protein + item.protein).toFixed(1)),
      carbs: Number((acc.carbs + item.carbs).toFixed(1)),
      fats: Number((acc.fats + item.fats).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

function scoreSuggestion(
  macros: MealSuggestion['estimatedMacros'],
  remainingMacros: MacroNutrients,
  remainingCalories: number,
) {
  const proteinGapAfter = Math.max(0, remainingMacros.protein - macros.protein);
  const calorieOverflow = Math.max(0, macros.calories - remainingCalories);
  const proteinBoost = Math.min(macros.protein, remainingMacros.protein);

  return proteinBoost * 3 - proteinGapAfter - calorieOverflow * 2;
}

function buildFoodsOnlySuggestions(foods: Food[], remainingCalories: number): MealSuggestion[] {
  const proteins = foods.filter((food) => food.referenceMacros.protein >= 10);
  const carbs = foods.filter((food) => food.referenceMacros.carbs >= 10);
  const vegetables = foods.filter(
    (food) => food.referenceMacros.calories <= 50 && food.referenceMacros.carbs <= 10,
  );
  const fats = foods.filter(
    (food) => food.referenceMacros.fats >= 30 || food.name.toLowerCase().includes('aceite'),
  );

  const suggestions: MealSuggestion[] = [];

  for (const protein of proteins.slice(0, 3)) {
    const carb = carbs.find((food) => food.id !== protein.id);
    const vegetable = vegetables.find((food) => ![protein.id, carb?.id].includes(food.id));
    const fat = fats.find((food) => ![protein.id, carb?.id, vegetable?.id].includes(food.id));

    const items: FavoriteDishItem[] = [
      { foodId: protein.id, quantity: getFoodDefaultServingAmount(protein) },
      ...(carb ? [{ foodId: carb.id, quantity: getFoodDefaultServingAmount(carb) }] : []),
      ...(vegetable ? [{ foodId: vegetable.id, quantity: getFoodDefaultServingAmount(vegetable) }] : []),
      ...(fat ? [{ foodId: fat.id, quantity: getFoodDefaultServingAmount(fat) }] : []),
    ];

    const estimatedMacros = sumMacros(
      items.map((item) => {
        const food = foods.find((entry) => entry.id === item.foodId);
        return food
          ? calculateServingMacros(food.referenceMacros, food.referenceAmount, item.quantity)
          : { calories: 0, protein: 0, carbs: 0, fats: 0 };
      }),
    );

    suggestions.push({
      id: `suggestion_foods_${protein.id}_${carb?.id ?? 'solo'}`,
      title: [protein.name, carb?.name].filter(Boolean).join(' con '),
      description: 'Combinacion construida solo con alimentos que ya tienes en tu catalogo curado.',
      whyItFits: 'Se apoya en tu base real de alimentos para que la propuesta sea registrable y repetible sin inventar ingredientes externos.',
      estimatedCalories: estimatedMacros.calories,
      estimatedMacros,
      items,
      foodNames: items
        .map((item) => foods.find((food) => food.id === item.foodId)?.name)
        .filter((name): name is string => Boolean(name)),
      sourceKind: 'foods-only',
      sourceLabel: 'Combinacion con tu catalogo',
    });
  }

  return suggestions;
}

function buildFavoriteAdaptations(favorites: FavoriteDish[], foods: Food[]): MealSuggestion[] {
  return favorites.slice(0, 3).map((favorite) => {
    const scaledItems = favorite.items.map((item) => ({
      ...item,
      quantity: Math.max(1, Number((item.quantity * 0.8).toFixed(1))),
    }));

    const estimatedMacros = sumMacros(
      scaledItems.map((item) => {
        const food = foods.find((entry) => entry.id === item.foodId);
        return food
          ? calculateServingMacros(food.referenceMacros, food.referenceAmount, item.quantity)
          : { calories: 0, protein: 0, carbs: 0, fats: 0 };
      }),
    );

    return {
      id: `suggestion_favorite_${favorite.id}`,
      title: `${favorite.name} ajustada para hoy`,
      description: 'Version retocada de una receta que ya usas para que encaje mejor con el punto actual del dia.',
      whyItFits: 'Parte de una receta conocida y la adapta con cantidades mas contenidas, asi que sigues dentro de tu sistema y no introduces ruido.',
      estimatedCalories: estimatedMacros.calories,
      estimatedMacros,
      items: scaledItems,
      foodNames: scaledItems
        .map((item) => foods.find((food) => food.id === item.foodId)?.name)
        .filter((name): name is string => Boolean(name)),
      sourceKind: 'favorite-adaptation',
      sourceLabel: favorite.name,
      basedOnFavoriteId: favorite.id,
    };
  });
}

function filterByMode(suggestions: MealSuggestion[], mode: MealSuggestionMode, focus: MealSuggestionFocus | undefined) {
  if (mode === 'craving') {
    return suggestions.sort((a, b) => b.estimatedMacros.carbs - a.estimatedMacros.carbs);
  }

  if (mode === 'alternate' && focus === 'protein') {
    return suggestions.sort((a, b) => b.estimatedMacros.protein - a.estimatedMacros.protein);
  }

  if (mode === 'alternate' && focus === 'quick') {
    return suggestions.sort((a, b) => a.items.length - b.items.length);
  }

  if (mode === 'alternate' && focus === 'snack') {
    return suggestions.filter((suggestion) => suggestion.estimatedCalories <= 260);
  }

  if (mode === 'alternate' && focus === 'light-dinner') {
    return suggestions.filter((suggestion) => suggestion.estimatedCalories <= 420);
  }

  if (mode === 'alternate' && focus === 'dessert-fit') {
    return suggestions.filter((suggestion) => suggestion.foodNames.some((name) => /platano|yogur|avena/i.test(name)));
  }

  return suggestions;
}

function buildAssistantIntro(mode: MealSuggestionMode, focus?: MealSuggestionFocus) {
  if (mode === 'craving') {
    return 'Te propongo opciones mas apetecibles, pero siempre usando solo alimentos que ya existen en tu catalogo.';
  }

  if (mode === 'alternate' && focus) {
    return `He afinado el enfoque en ${focus} sin salir del catalogo que ya tienes curado.`;
  }

  return 'Estas son las opciones mas alineadas con tu dia y con los alimentos que realmente tienes registrados.';
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

    let body: Record<string, any> | null = null;
    try {
      body = event.body ? (JSON.parse(event.body) as Record<string, any>) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }

    if (!body) {
      return json(400, { message: 'Missing request body' });
    }

    const {
      mode = 'recommended',
      focus,
      remainingCalories = 2200,
      remainingMacros = { calories: 2200, protein: 165, carbs: 220, fats: 70 },
    } = body;

    let foodsCatalog: Food[] = body.foodsCatalog;
    let favoriteDishes: FavoriteDish[] = body.favoriteDishes;

    // Fallback lookup if not provided in the client request
    if (!foodsCatalog || foodsCatalog.length === 0) {
      const foodsResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${sub}`,
            ':skPrefix': 'FOOD#',
          },
        }),
      );
      foodsCatalog = (foodsResult.Items ?? []).map((item) => ({
        id: item.logId || item.SK.replace('FOOD#', ''),
        name: item.name,
        referenceAmount: item.referenceAmount || 100,
        defaultServingAmount: item.defaultServingAmount,
        referenceMacros: item.referenceMacros,
      }));
    }

    if (!favoriteDishes || favoriteDishes.length === 0) {
      const favoritesResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${sub}`,
            ':skPrefix': 'FAVORITE#',
          },
        }),
      );
      favoriteDishes = (favoritesResult.Items ?? []).map((item) => ({
        id: item.favoriteDishId || item.SK.replace('FAVORITE#', ''),
        name: item.name,
        description: item.description,
        imageUri: item.imageUri,
        prepMinutes: item.prepMinutes,
        difficulty: item.difficulty,
        servings: item.servings,
        tags: item.tags || [],
        steps: item.steps || [],
        items: item.items || [],
      }));
    }

    const foodsOnly = buildFoodsOnlySuggestions(foodsCatalog, remainingCalories);
    const favoriteAdaptations = buildFavoriteAdaptations(favoriteDishes, foodsCatalog);
    const merged = [...foodsOnly, ...favoriteAdaptations]
      .filter((suggestion) => suggestion.items.every((item) => foodsCatalog.some((food) => food.id === item.foodId)))
      .sort((a, b) => scoreSuggestion(b.estimatedMacros, remainingMacros, remainingCalories) - scoreSuggestion(a.estimatedMacros, remainingMacros, remainingCalories));

    const filtered = filterByMode(merged, mode, focus)
      .sort((a, b) => scoreSuggestion(b.estimatedMacros, remainingMacros, remainingCalories) - scoreSuggestion(a.estimatedMacros, remainingMacros, remainingCalories))
      .slice(0, 3);

    return json(200, {
      assistantIntro: buildAssistantIntro(mode, focus),
      assistantFollowUp: 'Todas las propuestas se apoyan unicamente en tu catalogo y recetas ya guardadas.',
      suggestions: filtered,
      provider: 'lambda',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ai-suggestions error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
