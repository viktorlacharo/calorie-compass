import type { MacroNutrients } from '../types/nutrition';

export function sumMacros(items: MacroNutrients[]): MacroNutrients {
  return items.reduce<MacroNutrients>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Number((acc.protein + item.protein).toFixed(1)),
      carbs: Number((acc.carbs + item.carbs).toFixed(1)),
      fats: Number((acc.fats + item.fats).toFixed(1)),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  );
}
