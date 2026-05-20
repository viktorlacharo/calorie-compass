export type StoredFood = {
  entityType: 'FOOD';
  foodId: string;
  userSub: string;
  name: string;
  barcode?: string;
  brand?: string;
  referenceAmount: number;
  referenceUnit: 'g';
  referenceMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  defaultServingAmount?: number;
  supermarket?: string;
  createdAt: string;
  updatedAt: string;
};

export function toApiFood(stored: StoredFood) {
  return {
    id: stored.foodId,
    name: stored.name,
    barcode: stored.barcode ?? null,
    brand: stored.brand ?? null,
    referenceAmount: stored.referenceAmount,
    referenceUnit: stored.referenceUnit,
    referenceMacros: stored.referenceMacros,
    defaultServingAmount: stored.defaultServingAmount ?? null,
    supermarket: stored.supermarket ?? null,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}
