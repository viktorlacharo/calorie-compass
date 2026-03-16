import type { Food, MacroNutrients } from '@/types/nutrition';
import { calculateServingMacros } from '@/utils/calculatePerServing';

export function formatGramAmount(amount: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(amount)} g`;
}

export function getFoodDefaultServingAmount(food: Pick<Food, 'defaultServingAmount' | 'referenceAmount'>) {
  return food.defaultServingAmount ?? food.referenceAmount;
}

export function calculateFoodServingMacros(
  food: Pick<Food, 'referenceAmount' | 'referenceMacros'>,
  servingAmount: number
): MacroNutrients {
  if (servingAmount <= 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }

  return calculateServingMacros(food.referenceMacros, food.referenceAmount, servingAmount);
}

export function calculateFoodDefaultServingMacros(
  food: Pick<Food, 'referenceAmount' | 'referenceMacros' | 'defaultServingAmount'>
) {
  return calculateFoodServingMacros(food, getFoodDefaultServingAmount(food));
}
