import { mockFavoriteDishes } from '@/mocks/nutrition';
import type { CreateFavoriteDishInput } from '@/features/favorites/domain/favorite.contracts';
import { simulateFoodsRequest } from '@/features/foods/services/foods.mock-service';
import type { FavoriteDish } from '@/types/nutrition';

function cloneFavoriteDish(dish: FavoriteDish): FavoriteDish {
  return {
    ...dish,
    tags: [...dish.tags],
    steps: [...dish.steps],
    items: dish.items.map((item) => ({ ...item })),
  };
}

function cloneFavoriteDishes(dishes: FavoriteDish[]) {
  return dishes.map(cloneFavoriteDish);
}

let favoriteDishesStore = cloneFavoriteDishes(mockFavoriteDishes);

export function getFavoriteDishesSnapshot() {
  return cloneFavoriteDishes(favoriteDishesStore);
}

export async function listFavoriteDishes() {
  return simulateFoodsRequest(() => getFavoriteDishesSnapshot());
}

export async function getFavoriteDishById(id: string) {
  return simulateFoodsRequest(() => {
    const dish = favoriteDishesStore.find((entry) => entry.id === id);
    return dish ? cloneFavoriteDish(dish) : null;
  });
}

export async function createFavoriteDish(input: CreateFavoriteDishInput) {
  return simulateFoodsRequest(() => {
    const newDish: FavoriteDish = {
      id: `dish_${Date.now()}`,
      userId: 'user_001',
      name: input.name.trim(),
      description: input.description,
      imageUri: input.imageUri,
      prepMinutes: input.prepMinutes,
      difficulty: input.difficulty,
      servings: input.servings,
      tags: [...input.tags],
      steps: [...input.steps],
      items: input.items.map((item) => ({ ...item })),
      createdAt: new Date().toISOString(),
    };

    favoriteDishesStore = [newDish, ...favoriteDishesStore];
    return cloneFavoriteDish(newDish);
  });
}
