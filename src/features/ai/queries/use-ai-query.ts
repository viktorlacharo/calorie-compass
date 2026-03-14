import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiQueryKeys } from '@/features/ai/queries/ai.query-keys';
import {
  analyzeMealImage,
  createRecipeDraftFromSuggestion,
  getMealSuggestions,
  scanNutritionLabel,
} from '@/features/ai/services/ai.service';
import type {
  AiSuggestionRequest,
  CreateRecipeDraftRequest,
  CreateRecipeDraftResponse,
} from '@/features/ai/domain/ai.contracts';
import type { Food } from '@/types/nutrition';

export function useMealSuggestionsMutation() {
  return useMutation({
    mutationFn: (request: AiSuggestionRequest) => getMealSuggestions(request),
  });
}

export function useCreateRecipeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecipeDraftRequest) => createRecipeDraftFromSuggestion(input),
    onSuccess: (draft: CreateRecipeDraftResponse) => {
      queryClient.setQueryData(aiQueryKeys.selectedRecipeDraft(), draft);
    },
  });
}

export function clearSelectedRecipeDraft(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });
}

export function useNutritionLabelScanMutation() {
  return useMutation({
    mutationFn: (input: { imageUri: string }) => scanNutritionLabel(input),
  });
}

export function useVisualAnalysisMutation() {
  return useMutation({
    mutationFn: (input: { imageUri: string; foodsCatalog: Food[] }) => analyzeMealImage(input),
  });
}
