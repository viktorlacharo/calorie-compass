import { apiConfig, hasApiBaseUrl } from '@/lib/api/config';
import { httpRequest } from '@/lib/api/http-client';
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

function shouldUseLambdaApi() {
  return apiConfig.aiMode === 'lambda' && hasApiBaseUrl();
}

function buildAiUrl(path: string) {
  return `${apiConfig.apiBaseUrl}${path}`;
}

export async function getMealSuggestions(request: AiSuggestionRequest): Promise<AiSuggestionResponse> {
  if (shouldUseLambdaApi()) {
    return httpRequest<AiSuggestionResponse>(buildAiUrl('/ai/suggestions'), {
      method: 'POST',
      body: request,
    });
  }

  return getMealSuggestionsMock(request);
}

export async function createRecipeDraftFromSuggestion(
  request: CreateRecipeDraftRequest
): Promise<CreateRecipeDraftResponse> {
  if (shouldUseLambdaApi()) {
    return httpRequest<CreateRecipeDraftResponse>(buildAiUrl('/ai/recipe-drafts'), {
      method: 'POST',
      body: request,
    });
  }

  return createRecipeDraftFromSuggestionMock(request);
}

export async function scanNutritionLabel(
  request: ScanNutritionLabelRequest
): Promise<ScanNutritionLabelResponse> {
  if (shouldUseLambdaApi()) {
    return httpRequest<ScanNutritionLabelResponse>(buildAiUrl('/ai/scan-label'), {
      method: 'POST',
      body: request,
    });
  }

  return scanNutritionLabelMock(request);
}

export async function analyzeMealImage(
  request: AnalyzeMealImageRequest
): Promise<AnalyzeMealImageResponse> {
  if (shouldUseLambdaApi()) {
    return httpRequest<AnalyzeMealImageResponse>(buildAiUrl('/ai/analyze-meal'), {
      method: 'POST',
      body: request,
    });
  }

  return analyzeMealImageMock(request);
}
