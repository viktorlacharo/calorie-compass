export const ALLOWED_MEAL_LOG_SOURCES = ['manual', 'favorite', 'visual-analysis'] as const;

export type StoredMealLog = {
  entityType: 'MEAL_LOG';
  logId: string;
  userSub: string;
  consumedAt: string;
  source: (typeof ALLOWED_MEAL_LOG_SOURCES)[number];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  favoriteDishId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function toApiMealLog(stored: StoredMealLog) {
  return {
    id: stored.logId,
    userId: stored.userSub,
    consumedAt: stored.consumedAt,
    source: stored.source,
    total: stored.total,
    favoriteDishId: stored.favoriteDishId,
    notes: stored.notes,
  };
}

export function sumMacros(
  items: Array<{
    total: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }>,
) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.total.calories,
      protein: acc.protein + item.total.protein,
      carbs: acc.carbs + item.total.carbs,
      fats: acc.fats + item.total.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}
