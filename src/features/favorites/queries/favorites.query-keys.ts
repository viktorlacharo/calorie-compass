export const favoritesQueryKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoritesQueryKeys.all, 'list'] as const,
  list: () => [...favoritesQueryKeys.lists()] as const,
  details: () => [...favoritesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...favoritesQueryKeys.details(), id] as const,
};
