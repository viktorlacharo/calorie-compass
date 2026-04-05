import { createFavorite as createFavoriteAws, deleteFavorite as deleteFavoriteAws, getFavoriteById as getFavoriteByIdAws, getFavorites as getFavoritesAws } from '@/lib/api/generated/aws-api';
import type { CreateFavoriteDishInput } from '@/features/favorites/domain/favorite.contracts';
import type { FavoriteDish } from '@/types/nutrition';

export async function listFavoriteDishes(): Promise<FavoriteDish[]> {
  const response = await getFavoritesAws();
  return response.items as FavoriteDish[];
}

export async function getFavoriteDishById(id: string): Promise<FavoriteDish | null> {
  const response = await getFavoriteByIdAws(id);
  return (response.item as FavoriteDish) ?? null;
}

export async function createFavoriteDish(input: CreateFavoriteDishInput): Promise<FavoriteDish> {
  const response = await createFavoriteAws({
    name: input.name.trim(),
    description: input.description,
    imageUri: input.imageUri,
    prepMinutes: input.prepMinutes,
    difficulty: input.difficulty,
    servings: input.servings,
    tags: [...input.tags],
    steps: [...input.steps],
    items: input.items.map((item) => ({ ...item })),
  });

  return response.item as FavoriteDish;
}

export async function deleteFavoriteDish(id: string): Promise<void> {
  await deleteFavoriteAws(id);
}
