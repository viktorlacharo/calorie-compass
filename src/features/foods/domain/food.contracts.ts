import type { Food, FavoriteDish, Supermarket } from '@/types/nutrition';

export type CreateFoodInput = {
  name: string;
  referenceAmount: number;
  referenceMacros: Food['referenceMacros'];
  defaultServingAmount?: number;
  supermarket?: Supermarket | null;
};

export type UpdateFoodInput = CreateFoodInput;

export type FoodsListFilters = {
  query?: string;
};

export type DeleteFoodResult =
  | { status: 'deleted' }
  | { status: 'blocked'; recipeCount: number };

export type FoodsRepository = {
  list: (filters?: FoodsListFilters) => Promise<Food[]>;
  getById: (id: string) => Promise<Food | null>;
  create: (input: CreateFoodInput) => Promise<Food>;
  update: (id: string, input: UpdateFoodInput) => Promise<Food>;
  remove: (id: string) => Promise<DeleteFoodResult>;
};

export type FoodsRepositoryDependencies = {
  foods: Food[];
  favoriteDishes: FavoriteDish[];
  addFood: (input: CreateFoodInput) => Food;
  updateFood: (id: string, input: UpdateFoodInput) => Food | null;
  deleteFood: (id: string) => boolean;
};
