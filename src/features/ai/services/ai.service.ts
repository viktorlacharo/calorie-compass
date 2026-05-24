import { apiConfig, hasApiBaseUrl } from '@/lib/api/config';
import {
  analyzeMealImage as analyzeMealImageAws,
  createAiRecipeDraft as createRecipeDraftAws,
  getAiSuggestions as getMealSuggestionsAws,
  scanNutritionLabel as scanNutritionLabelAws,
} from '@/lib/api/generated/aws-api';
import {
  analyzeMealImage as analyzeMealImageMock,
  createRecipeDraftFromSuggestion as createRecipeDraftFromSuggestionMock,
  getMealSuggestions as getMealSuggestionsMock,
  scanNutritionLabel as scanNutritionLabelMock,
} from '@/features/ai/services/ai.mock-backend';
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
import { uploadImageToS3 } from '@/utils/upload';

const mapFoodToApi = (f: any) => ({
  id: f.id,
  name: f.name,
  referenceAmount: f.referenceAmount,
  referenceUnit: (f.referenceUnit ?? 'g') as 'g',
  referenceMacros: {
    calories: f.referenceMacros.calories,
    protein: f.referenceMacros.protein,
    carbs: f.referenceMacros.carbs,
    fats: f.referenceMacros.fats,
  },
  defaultServingAmount: f.defaultServingAmount ?? null,
  barcode: f.barcode ?? null,
  brand: f.brand ?? null,
  supermarket: f.supermarket ?? null,
  createdAt: f.createdAt || new Date().toISOString(),
  updatedAt: f.updatedAt || f.createdAt || new Date().toISOString(),
});

function shouldUseLambdaApi() {
  return apiConfig.aiMode === 'lambda' && hasApiBaseUrl();
}

export async function getMealSuggestions(request: AiSuggestionRequest): Promise<AiSuggestionResponse> {
  if (shouldUseLambdaApi()) {
    const response = await getMealSuggestionsAws({
      mode: request.mode,
      focus: request.focus,
      nutritionScore: request.nutritionScore,
      todayMeals: request.todayMeals as any[],
      todayTotals: request.todayTotals,
      dailyCalorieTarget: request.dailyCalorieTarget,
      dailyMacroTarget: request.dailyMacroTarget,
      remainingCalories: request.remainingCalories,
      remainingMacros: request.remainingMacros,
      foodsCatalog: request.foodsCatalog?.map(mapFoodToApi),
      favoriteDishes: request.favoriteDishes,
      requestId: request.requestId,
    });
    return response as unknown as AiSuggestionResponse;
  }

  return getMealSuggestionsMock(request);
}

export async function createRecipeDraftFromSuggestion(
  request: CreateRecipeDraftRequest
): Promise<CreateRecipeDraftResponse> {
  if (shouldUseLambdaApi()) {
    const response = await createRecipeDraftAws({
      suggestionId: request.suggestionId,
      mode: request.mode,
      focus: request.focus,
      modeLabel: request.modeLabel,
      foodsCatalog: request.foodsCatalog?.map(mapFoodToApi),
      sourceResponse: request.sourceResponse as any,
    });
    return response as unknown as CreateRecipeDraftResponse;
  }

  return createRecipeDraftFromSuggestionMock(request);
}

export async function scanNutritionLabel(
  request: ScanNutritionLabelRequest
): Promise<ScanNutritionLabelResponse> {
  if (shouldUseLambdaApi()) {
    // 1. Upload local photo URI to S3
    const imageKey = await uploadImageToS3(request.imageUri, 'labels');

    // 2. Scan S3 image using Gemini backend Lambda
    const response = await scanNutritionLabelAws({
      imageKey,
    });

    return response as unknown as ScanNutritionLabelResponse;
  }

  return scanNutritionLabelMock(request);
}

export async function analyzeMealImage(
  request: AnalyzeMealImageRequest
): Promise<AnalyzeMealImageResponse> {
  if (shouldUseLambdaApi()) {
    // 1. Upload local photo URI to S3
    const imageKey = await uploadImageToS3(request.imageUri, 'meals');

    // 2. Analyze S3 image crossing with catalog using Gemini backend Lambda
    const response = await analyzeMealImageAws({
      imageKey,
      foodsCatalog: request.foodsCatalog?.map(mapFoodToApi),
    });

    return response as unknown as AnalyzeMealImageResponse;
  }

  return analyzeMealImageMock(request);
}


