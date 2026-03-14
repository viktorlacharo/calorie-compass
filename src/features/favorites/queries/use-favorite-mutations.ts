import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFavoriteDishInput } from '@/features/favorites/domain/favorite.contracts';
import { createFavoriteDish } from '@/features/favorites/services/favorites.mock-backend';
import { favoritesQueryKeys } from '@/features/favorites/queries/favorites.query-keys';

export function useCreateFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFavoriteDishInput) => createFavoriteDish(input),
    onSuccess: (createdDish) => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.all });
      queryClient.setQueryData(favoritesQueryKeys.detail(createdDish.id), createdDish);
    },
  });
}
