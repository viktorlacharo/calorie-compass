import { useQuery } from '@tanstack/react-query';
import { getFoodById, listFoods } from '@/features/foods/services/foods.mock-backend';
import { foodsQueryKeys } from '@/features/foods/queries/foods.query-keys';

export function useFoodsQuery(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: foodsQueryKeys.list(normalizedQuery ? { query: normalizedQuery } : undefined),
    queryFn: () => listFoods(normalizedQuery ? { query: normalizedQuery } : undefined),
  });
}

export function useFoodQuery(id?: string) {
  return useQuery({
    queryKey: foodsQueryKeys.detail(id ?? 'unknown'),
    queryFn: () => getFoodById(id ?? ''),
    enabled: Boolean(id),
  });
}
