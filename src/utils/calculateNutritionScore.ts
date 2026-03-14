import type { MacroNutrients } from '@/types/nutrition';

export function calculateNutritionScore(macros: MacroNutrients) {
  return Math.max(
    62,
    Math.min(
      96,
      Math.round(
        78 +
          Math.min(12, macros.protein / 12) +
          Math.min(6, macros.carbs / 45) +
          Math.max(0, 6 - Math.abs(macros.fats - 55) / 4)
      )
    )
  );
}
