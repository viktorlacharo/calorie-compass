import type {
  AiRecipeDraft,
  Food,
  MealSuggestionMode,
  MealSuggestionFocus,
  MealSuggestionRequest,
  MealSuggestionResponse,
  NutritionLabelScanResult,
  VisualAnalysisResult,
} from '@/types/nutrition';

export type AiSuggestionRequest = MealSuggestionRequest & {
  requestId?: string;
};

export type AiSuggestionResponse = MealSuggestionResponse & {
  provider: 'mock' | 'lambda';
  generatedAt: string;
};

export type CreateRecipeDraftRequest = {
  suggestionId: string;
  mode: MealSuggestionMode;
  focus?: MealSuggestionFocus;
  modeLabel: string;
  foodsCatalog: Food[];
  sourceResponse: MealSuggestionResponse;
};

export type CreateRecipeDraftResponse = AiRecipeDraft & {
  provider: 'mock' | 'lambda';
};

export type ScanNutritionLabelRequest = {
  imageUri: string;
};

export type ScanNutritionLabelResponse = NutritionLabelScanResult & {
  provider: 'mock' | 'lambda';
};

export type AnalyzeMealImageRequest = {
  imageUri: string;
  foodsCatalog: Food[];
};

export type AnalyzeMealImageResponse = VisualAnalysisResult & {
  provider: 'mock' | 'lambda';
};
