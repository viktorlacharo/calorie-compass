import { useQuery } from '@tanstack/react-query';
import { getFavoriteDishById, listFavoriteDishes } from '@/features/favorites/services/favorites.service';
import { favoritesQueryKeys } from '@/features/favorites/queries/favorites.query-keys';

export function useFavoritesQuery() {
  return useQuery({
    queryKey: favoritesQueryKeys.list(),
    queryFn: listFavoriteDishes,
  });
}

export function useFavoriteQuery(id?: string) {
  return useQuery({
    queryKey: favoritesQueryKeys.detail(id ?? 'unknown'),
    queryFn: () => getFavoriteDishById(id ?? ''),
    enabled: Boolean(id),
  });
}
