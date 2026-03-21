import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFoodInput, UpdateFoodInput } from '@/features/foods/domain/food.contracts';
import { createFood, lookupFoodByBarcode, removeFood, updateFood } from '@/features/foods/services/foods.service';
import { foodsQueryKeys } from '@/features/foods/queries/foods.query-keys';

export function useCreateFoodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFoodInput) => createFood(input),
    onSuccess: (createdFood) => {
      queryClient.invalidateQueries({ queryKey: foodsQueryKeys.all });
      queryClient.setQueryData(foodsQueryKeys.detail(createdFood.id), createdFood);
    },
  });
}

export function useUpdateFoodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFoodInput }) => updateFood(id, input),
    onSuccess: (updatedFood) => {
      queryClient.invalidateQueries({ queryKey: foodsQueryKeys.all });
      queryClient.setQueryData(foodsQueryKeys.detail(updatedFood.id), updatedFood);
    },
  });
}

export function useDeleteFoodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeFood(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: foodsQueryKeys.all });
      queryClient.removeQueries({ queryKey: foodsQueryKeys.detail(id) });
    },
  });
}

export function useBarcodeLookupMutation() {
  return useMutation({
    mutationFn: (barcode: string) => lookupFoodByBarcode(barcode),
  });
}
