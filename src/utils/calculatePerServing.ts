import type { MacroNutrients } from '../types/nutrition';

export function calculatePerServing(per100g: MacroNutrients, grams: number): MacroNutrients {
  const factor = grams / 100;

  return {
    calories: Math.round(per100g.calories * factor),
    protein: Number((per100g.protein * factor).toFixed(1)),
    carbs: Number((per100g.carbs * factor).toFixed(1)),
    fats: Number((per100g.fats * factor).toFixed(1)),
  };
}
