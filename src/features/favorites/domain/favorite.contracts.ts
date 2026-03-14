import type { FavoriteDish, FavoriteDishItem } from '@/types/nutrition';

export type CreateFavoriteDishInput = {
  name: string;
  description: string;
  imageUri: string;
  prepMinutes: number;
  difficulty: FavoriteDish['difficulty'];
  servings: number;
  tags: string[];
  steps: string[];
  items: FavoriteDishItem[];
};
