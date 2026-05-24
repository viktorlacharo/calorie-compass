import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { getUserSub, json } from '../shared/http';

type FavoriteDishItem = {
  foodId: string;
  quantity: number;
};

type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Food = {
  id: string;
  name: string;
};

type MealSuggestion = {
  id: string;
  title: string;
  whyItFits: string;
  estimatedCalories: number;
  estimatedMacros: MacroNutrients;
  items: FavoriteDishItem[];
  sourceKind: 'foods-only' | 'favorite-adaptation';
  sourceLabel: string;
};

function buildFoodMap(foods: Food[]) {
  return new Map(foods.map((food) => [food.id, food]));
}

function buildDraftSteps(foodNames: string[], sourceKind: MealSuggestion['sourceKind']) {
  if (sourceKind === 'favorite-adaptation') {
    return [
      'Revisa la receta base y confirma que las cantidades propuestas encajan con lo que quieres comer hoy.',
      `Prepara y combina ${foodNames.join(', ')} usando tu rutina habitual para mantener la consistencia del recetario.`,
      'Ajusta cantidades o tags antes de guardar la version final en tu biblioteca.',
    ];
  }

  return [
    `Prepara ${foodNames.join(', ')} con las cantidades sugeridas desde tu catalogo actual.`,
    'Monta el plato siguiendo tu forma habitual de cocinar para que la receta siga siendo repetible.',
    'Guarda la combinacion final solo despues de revisar cantidades, tags y coherencia nutricional.',
  ];
}

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
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

    const { suggestionId, modeLabel, foodsCatalog = [], sourceResponse } = body;

    if (!suggestionId || !sourceResponse || !sourceResponse.suggestions) {
      return json(400, { message: 'Missing suggestionId or sourceResponse parameters' });
    }

    const suggestions: MealSuggestion[] = sourceResponse.suggestions;
    const suggestion = suggestions.find((entry) => entry.id === suggestionId);

    if (!suggestion) {
      return json(404, { message: 'Suggestion not found in source response' });
    }

    const foodMap = buildFoodMap(foodsCatalog);
    const foodNames = suggestion.items
      .map((item) => foodMap.get(item.foodId)?.name)
      .filter((name): name is string => Boolean(name));

    const response = {
      draftId: `draft_${Date.now()}`,
      suggestionId: suggestion.id,
      title: suggestion.title,
      description:
        suggestion.sourceKind === 'favorite-adaptation'
          ? 'Borrador generado desde una receta ya conocida y ajustado con tus cantidades actuales.'
          : 'Borrador generado solo con alimentos reales de tu catalogo curado.',
      whyItFits: suggestion.whyItFits,
      items: suggestion.items.map((item) => ({ ...item })),
      estimatedMacros: { ...suggestion.estimatedMacros },
      estimatedCalories: suggestion.estimatedCalories,
      modeLabel: modeLabel || 'Sugerida',
      sourceLabel: suggestion.sourceLabel,
      tags: Array.from(
        new Set([
          'Sugerida por AI',
          modeLabel || 'Sugerida',
          suggestion.sourceKind === 'favorite-adaptation' ? 'Basada en favorito' : 'Desde catalogo',
        ]),
      ),
      steps: buildDraftSteps(foodNames, suggestion.sourceKind),
      provider: 'lambda',
    };

    return json(200, response);
  } catch (error) {
    console.error('ai-recipe-drafts error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
