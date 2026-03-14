import { mockFavoriteDishes, mockFoods } from '@/mocks/nutrition';
import type {
  CreateFoodInput,
  DeleteFoodResult,
  FoodsListFilters,
  UpdateFoodInput,
} from '@/features/foods/domain/food.contracts';
import { simulateFoodsRequest } from '@/features/foods/services/foods.mock-service';
import type { Food } from '@/types/nutrition';

type FoodsStoreListener = (foods: Food[]) => void;

const foodsStoreListeners = new Set<FoodsStoreListener>();

let foodsStore = cloneFoods(mockFoods);

function cloneFood(food: Food): Food {
  return {
    ...food,
    per100g: { ...food.per100g },
  };
}

function cloneFoods(foods: Food[]): Food[] {
  return foods.map(cloneFood);
}

function notifyFoodsStoreListeners() {
  const snapshot = getFoodsSnapshot();

  foodsStoreListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function filterFoods(query: string | undefined, foods: Food[]) {
  if (!query?.trim()) {
    return foods;
  }

  const lowerQuery = query.trim().toLowerCase();
  return foods.filter((food) => food.name.toLowerCase().includes(lowerQuery));
}

export function getFoodsSnapshot() {
  return cloneFoods(foodsStore);
}

export function subscribeToFoodsStore(listener: FoodsStoreListener) {
  foodsStoreListeners.add(listener);
  return () => {
    foodsStoreListeners.delete(listener);
  };
}

export function createFoodSync(input: CreateFoodInput) {
  const newFood: Food = {
    id: `food_${Date.now()}`,
    userId: 'user_001',
    name: input.name.trim(),
    servingUnit: input.servingUnit,
    servingSize: input.servingSize,
    supermarket: input.supermarket ?? undefined,
    per100g: { ...input.per100g },
    createdAt: new Date().toISOString(),
  };

  foodsStore = [newFood, ...foodsStore];
  notifyFoodsStoreListeners();
  return cloneFood(newFood);
}

export function updateFoodSync(id: string, input: UpdateFoodInput) {
  let updatedFood: Food | null = null;

  foodsStore = foodsStore.map((food) => {
    if (food.id !== id) {
      return food;
    }

    updatedFood = {
      ...food,
      name: input.name.trim(),
      servingUnit: input.servingUnit,
      servingSize: input.servingSize,
      supermarket: input.supermarket ?? undefined,
      per100g: { ...input.per100g },
    };

    return updatedFood;
  });

  if (updatedFood) {
    notifyFoodsStoreListeners();
    return cloneFood(updatedFood);
  }

  return null;
}

export function deleteFoodSync(id: string) {
  const exists = foodsStore.some((food) => food.id === id);

  if (!exists) {
    return false;
  }

  foodsStore = foodsStore.filter((food) => food.id !== id);
  notifyFoodsStoreListeners();
  return true;
}

export async function listFoods(filters?: FoodsListFilters) {
  return simulateFoodsRequest(() => filterFoods(filters?.query, getFoodsSnapshot()));
}

export async function getFoodById(id: string) {
  return simulateFoodsRequest(() => {
    const food = foodsStore.find((entry) => entry.id === id);
    return food ? cloneFood(food) : null;
  });
}

export async function createFood(input: CreateFoodInput) {
  return simulateFoodsRequest(() => createFoodSync(input));
}

export async function updateFood(id: string, input: UpdateFoodInput) {
  return simulateFoodsRequest(() => {
    const updatedFood = updateFoodSync(id, input);

    if (!updatedFood) {
      throw new Error('Food not found');
    }

    return updatedFood;
  });
}

export async function removeFood(id: string): Promise<DeleteFoodResult> {
  return simulateFoodsRequest(() => {
    const recipeCount = mockFavoriteDishes.filter((dish) => dish.items.some((item) => item.foodId === id)).length;

    if (recipeCount > 0) {
      return { status: 'blocked', recipeCount } as const;
    }

    deleteFoodSync(id);
    return { status: 'deleted' } as const;
  });
}
