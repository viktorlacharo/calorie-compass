import { mockNutritionLabelScan, mockVisualAnalysis } from '@/mocks/nutrition';
import { AI_DAILY_BUDGET, AI_DAILY_MACRO_TARGET } from '@/features/ai/config/ai.constants';
import { simulateFoodsRequest } from '@/features/foods/services/foods.mock-service';
import { sumMacros } from '@/utils/sumMacros';
import {
  calculateFoodServingMacros,
  getFoodDefaultServingAmount,
} from '@/utils/foodMeasurements';
import type {
  AiSuggestionRequest,
  AiSuggestionResponse,
  AnalyzeMealImageRequest,
  AnalyzeMealImageResponse,
  CreateRecipeDraftRequest,
  CreateRecipeDraftResponse,
  ScanNutritionLabelRequest,
  ScanNutritionLabelResponse,
} from '@/features/ai/domain/ai.contracts';
import type {
  AiRecipeDraft,
  FavoriteDish,
  FavoriteDishItem,
  Food,
  MealSuggestion,
  MealSuggestionFocus,
  MealSuggestionMode,
  MealSuggestionRequest,
  MealSuggestionResponse,
  VisualAnalysisResult,
} from '@/types/nutrition';

function buildFoodMap(foods: Food[]) {
  return new Map(foods.map((food) => [food.id, food]));
}

function scoreSuggestion(macros: MealSuggestion['estimatedMacros'], request: MealSuggestionRequest) {
  const proteinGapAfter = Math.max(0, request.remainingMacros.protein - macros.protein);
  const calorieOverflow = Math.max(0, macros.calories - request.remainingCalories);
  const proteinBoost = Math.min(macros.protein, request.remainingMacros.protein);

  return proteinBoost * 3 - proteinGapAfter - calorieOverflow * 2;
}

function buildFoodsOnlySuggestions(foods: Food[], request: MealSuggestionRequest): MealSuggestion[] {
  const proteins = foods.filter((food) => food.referenceMacros.protein >= 10);
  const carbs = foods.filter((food) => food.referenceMacros.carbs >= 10);
  const vegetables = foods.filter(
    (food) => food.referenceMacros.calories <= 50 && food.referenceMacros.carbs <= 10
  );
  const fats = foods.filter(
    (food) => food.referenceMacros.fats >= 30 || food.name.toLowerCase().includes('aceite')
  );

  const suggestions: MealSuggestion[] = [];

  for (const protein of proteins.slice(0, 3)) {
    const carb = carbs.find((food) => food.id !== protein.id);
    const vegetable = vegetables.find((food) => ![protein.id, carb?.id].includes(food.id));
    const fat = fats.find((food) => ![protein.id, carb?.id, vegetable?.id].includes(food.id));

    const items: FavoriteDishItem[] = [
      { foodId: protein.id, quantity: getFoodDefaultServingAmount(protein) },
      ...(carb
        ? [{ foodId: carb.id, quantity: getFoodDefaultServingAmount(carb) }]
        : []),
      ...(vegetable
        ? [
            {
              foodId: vegetable.id,
              quantity: getFoodDefaultServingAmount(vegetable),
            },
          ]
        : []),
      ...(fat ? [{ foodId: fat.id, quantity: getFoodDefaultServingAmount(fat) }] : []),
    ];

    const estimatedMacros = sumMacros(
      items.map((item) => {
        const food = foods.find((entry) => entry.id === item.foodId);
        return food ? calculateFoodServingMacros(food, item.quantity) : { calories: 0, protein: 0, carbs: 0, fats: 0 };
      })
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
        return food ? calculateFoodServingMacros(food, item.quantity) : { calories: 0, protein: 0, carbs: 0, fats: 0 };
      })
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
    } satisfies MealSuggestion;
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

export async function getMealSuggestions(request: AiSuggestionRequest): Promise<AiSuggestionResponse> {
  return simulateFoodsRequest(() => {
    const foodsOnly = buildFoodsOnlySuggestions(request.foodsCatalog, request);
    const favoriteAdaptations = buildFavoriteAdaptations(request.favoriteDishes, request.foodsCatalog);
    const merged = [...foodsOnly, ...favoriteAdaptations]
      .filter((suggestion) => suggestion.items.every((item) => request.foodsCatalog.some((food) => food.id === item.foodId)))
      .sort((a, b) => scoreSuggestion(b.estimatedMacros, request) - scoreSuggestion(a.estimatedMacros, request));

    const filtered = filterByMode(merged, request.mode, request.focus)
      .sort((a, b) => scoreSuggestion(b.estimatedMacros, request) - scoreSuggestion(a.estimatedMacros, request))
      .slice(0, 3);

    return {
      assistantIntro: buildAssistantIntro(request.mode, request.focus),
      assistantFollowUp: 'Todas las propuestas se apoyan unicamente en tu catalogo y recetas ya guardadas.',
      suggestions: filtered,
      provider: 'mock',
      generatedAt: new Date().toISOString(),
    };
  });
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

export async function createRecipeDraftFromSuggestion(input: CreateRecipeDraftRequest): Promise<CreateRecipeDraftResponse> {
  return simulateFoodsRequest(() => {
    const suggestion = input.sourceResponse.suggestions.find((entry) => entry.id === input.suggestionId);

    if (!suggestion) {
      throw new Error('Suggestion not found in source response');
    }

    const foodMap = buildFoodMap(input.foodsCatalog);
    const foodNames = suggestion.items
      .map((item) => foodMap.get(item.foodId)?.name)
      .filter((name): name is string => Boolean(name));

    return {
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
      modeLabel: input.modeLabel,
      sourceLabel: suggestion.sourceLabel,
      tags: Array.from(
        new Set([
          'Sugerida por AI',
          input.modeLabel,
          suggestion.sourceKind === 'favorite-adaptation' ? 'Basada en favorito' : 'Desde catalogo',
        ])
      ),
      steps: buildDraftSteps(foodNames, suggestion.sourceKind),
      provider: 'mock',
    };
  });
}

export async function scanNutritionLabel(input: ScanNutritionLabelRequest): Promise<ScanNutritionLabelResponse> {
  return simulateFoodsRequest(() => ({
    ...mockNutritionLabelScan,
    detectedName: mockNutritionLabelScan.detectedName,
    confidence: mockNutritionLabelScan.confidence,
    provider: 'mock',
  }));
}

export async function analyzeMealImage(input: AnalyzeMealImageRequest): Promise<AnalyzeMealImageResponse> {
  return simulateFoodsRequest(() => {
    const catalogMap = new Map(input.foodsCatalog.map((food) => [food.id, food]));
    const items = mockVisualAnalysis.items
      .map((item) => {
        const matchedFood = item.matchedFoodId ? catalogMap.get(item.matchedFoodId) : null;

        if (!matchedFood) {
          return null;
        }

        return {
          ...item,
          detectedFoodName: matchedFood.name,
          estimatedMacros: calculateFoodServingMacros(matchedFood, item.estimatedQuantity),
        };
      })
      .filter((item): item is VisualAnalysisResult['items'][number] => Boolean(item));

    return {
      imageId: `visual_${Date.now()}`,
      items,
      total: sumMacros(items.map((item) => item.estimatedMacros)),
      provider: 'mock',
    };
  });
}
