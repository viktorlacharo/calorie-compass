import { createFood as createFoodAws, getFoods as getFoodsAws } from '@/lib/api/generated/aws-api';
import type {
  CreateFoodInput,
  DeleteFoodResult,
  FoodsListFilters,
  UpdateFoodInput,
} from '@/features/foods/domain/food.contracts';
import type { Food } from '@/types/nutrition';

function filterFoodsByQuery(foods: Food[], query: string | undefined) {
  if (!query?.trim()) {
    return foods;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return foods.filter((food) => food.name.toLowerCase().includes(normalizedQuery));
}

export async function listFoods(filters?: FoodsListFilters) {
  const foodsResponse = await getFoodsAws();
  const foods = foodsResponse.items as Food[];
  return filterFoodsByQuery(foods, filters?.query);
}

export async function getFoodById(id: string) {
  const foods = await listFoods();
  return foods.find((entry) => entry.id === id) ?? null;
}

export async function createFood(input: CreateFoodInput) {
  const response = await createFoodAws({
    name: input.name.trim(),
    referenceMacros: { ...input.referenceMacros },
    defaultServingAmount: input.defaultServingAmount,
    supermarket: input.supermarket ?? null,
  });

  return response.item as Food;
}

export async function updateFood(id: string, input: UpdateFoodInput): Promise<Food> {
  void id;
  void input;
  throw new Error('Actualizar alimentos en AWS aun no esta disponible.');
}

export async function removeFood(id: string): Promise<DeleteFoodResult> {
  void id;
  throw new Error('Eliminar alimentos en AWS aun no esta disponible.');
}
