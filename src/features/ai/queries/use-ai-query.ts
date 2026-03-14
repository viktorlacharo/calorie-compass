import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiQueryKeys } from '@/features/ai/queries/ai.query-keys';
import { analyzeMealImage, createRecipeDraftFromSuggestion, getMealSuggestions, scanNutritionLabel } from '@/features/ai/services/ai.mock-backend';
import type { AiRecipeDraft, Food, MealSuggestion, MealSuggestionRequest } from '@/types/nutrition';

export function useMealSuggestionsMutation() {
  return useMutation({
    mutationFn: (request: MealSuggestionRequest) => getMealSuggestions(request),
  });
}

export function useCreateRecipeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { suggestion: MealSuggestion; modeLabel: string; foodsCatalog: Food[] }) =>
      createRecipeDraftFromSuggestion(input),
    onSuccess: (draft: AiRecipeDraft) => {
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
