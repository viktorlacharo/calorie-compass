import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFavoriteDishInput } from '@/features/favorites/domain/favorite.contracts';
import { createFavoriteDish, deleteFavoriteDish } from '@/features/favorites/services/favorites.service';
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

export function useDeleteFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFavoriteDish(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.all });
      queryClient.removeQueries({ queryKey: favoritesQueryKeys.detail(id) });
    },
  });
}
