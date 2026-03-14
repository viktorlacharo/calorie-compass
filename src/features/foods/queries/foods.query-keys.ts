import type { FoodsListFilters } from '@/features/foods/domain/food.contracts';

export const foodsQueryKeys = {
  all: ['foods'] as const,
  lists: () => [...foodsQueryKeys.all, 'list'] as const,
  list: (filters?: FoodsListFilters) => [...foodsQueryKeys.lists(), filters ?? {}] as const,
  details: () => [...foodsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...foodsQueryKeys.details(), id] as const,
};
