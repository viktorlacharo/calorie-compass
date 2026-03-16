import type { MacroNutrients } from '../types/nutrition';

export function calculateServingMacros(
  referenceMacros: MacroNutrients,
  referenceAmount: number,
  servingAmount: number
): MacroNutrients {
  if (referenceAmount <= 0 || servingAmount <= 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }

  const factor = servingAmount / referenceAmount;

  return {
    calories: Math.round(referenceMacros.calories * factor),
    protein: Number((referenceMacros.protein * factor).toFixed(1)),
    carbs: Number((referenceMacros.carbs * factor).toFixed(1)),
    fats: Number((referenceMacros.fats * factor).toFixed(1)),
  };
}
