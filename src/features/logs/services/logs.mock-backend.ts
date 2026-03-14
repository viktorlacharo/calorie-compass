import { MOCK_DAILY_BUDGET, mockDailyNutritionLogs, mockMealLogEntries, mockWeightEntries } from '@/mocks/nutrition';
import { simulateFoodsRequest } from '@/features/foods/services/foods.mock-service';
import { sumMacros } from '@/utils/sumMacros';
import type { DailyNutritionLog, MealLogEntry, WeightEntry } from '@/types/nutrition';

type TimelineRange = 'week' | 'month';

function cloneMealLogEntry(entry: MealLogEntry): MealLogEntry {
  return {
    ...entry,
    total: { ...entry.total },
  };
}

function cloneDailyLog(log: DailyNutritionLog): DailyNutritionLog {
  return {
    ...log,
    total: { ...log.total },
    meals: log.meals.map(cloneMealLogEntry),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

let mealLogEntriesStore = mockMealLogEntries.map(cloneMealLogEntry);

type MealLogMutationInput = Omit<MealLogEntry, 'id' | 'userId' | 'consumedAt'> & { consumedAt?: string };

export function addMealLogEntrySync(entry: MealLogMutationInput) {
  const newEntry: MealLogEntry = {
    ...entry,
    id: `log_${Date.now()}`,
    userId: 'user_001',
    consumedAt: entry.consumedAt ?? new Date().toISOString(),
    total: { ...entry.total },
  };

  mealLogEntriesStore = [newEntry, ...mealLogEntriesStore];
  return cloneMealLogEntry(newEntry);
}

export async function createMealLogEntry(entry: MealLogMutationInput) {
  return simulateFoodsRequest(() => addMealLogEntrySync(entry));
}

export async function listTodayMealLogEntries() {
  return simulateFoodsRequest(() => mealLogEntriesStore.map(cloneMealLogEntry));
}

export async function getDashboardSummary() {
  return simulateFoodsRequest(() => {
    const entries = mealLogEntriesStore.map(cloneMealLogEntry);
    const totals = sumMacros(entries.map((entry) => entry.total));

    return {
      entries,
      totals,
      budget: MOCK_DAILY_BUDGET,
      remainingCalories: Math.max(0, MOCK_DAILY_BUDGET - totals.calories),
      remainingProtein: Math.max(0, 165 - totals.protein),
    };
  });
}

export async function getTimelineAnalytics(range: TimelineRange) {
  return simulateFoodsRequest(() => {
    const logs = (range === 'week' ? mockDailyNutritionLogs.slice(-7) : mockDailyNutritionLogs).map(cloneDailyLog);
    const macroTotals = sumMacros(logs.map((log) => log.total));
    const calorieSeries = logs.map((log) => ({
      label:
        range === 'week'
          ? new Date(`${log.date}T12:00:00.000Z`).toLocaleDateString('es-ES', { weekday: 'short' })
          : String(new Date(`${log.date}T12:00:00.000Z`).getUTCDate()),
      value: log.total.calories,
    }));

    const averageCalories = average(logs.map((log) => log.total.calories));
    const adherence = Math.round(
      (logs.filter((log) => log.total.calories <= log.calorieTarget).length / logs.length) * 100
    );
    const bestDay = logs.reduce((best, log) =>
      Math.abs(log.calorieTarget - log.total.calories) < Math.abs(best.calorieTarget - best.total.calories)
        ? log
        : best
    );

    const weightSeriesSource = range === 'week' ? mockWeightEntries.slice(-4) : mockWeightEntries;
    const weightSeries = weightSeriesSource.map((entry: WeightEntry) => ({
      label:
        range === 'week'
          ? new Date(`${entry.date}T12:00:00.000Z`).toLocaleDateString('es-ES', { weekday: 'short' })
          : new Date(`${entry.date}T12:00:00.000Z`).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      value: entry.weightKg,
    }));
    const firstWeight = weightSeriesSource[0]?.weightKg ?? 0;
    const currentWeight = weightSeriesSource[weightSeriesSource.length - 1]?.weightKg ?? 0;
    const delta = Number((currentWeight - firstWeight).toFixed(1));

    return {
      logs,
      calorieSeries,
      macroTotals,
      averageCalories,
      adherence,
      bestDay,
      mealCount: logs.reduce((sum, log) => sum + log.mealCount, 0),
      weightSeries,
      firstWeight,
      currentWeight,
      delta,
    };
  });
}

export async function getCalendarMonth() {
  return simulateFoodsRequest(() => {
    const logs = mockDailyNutritionLogs.map(cloneDailyLog);
    const monthDays = logs.map((log) => {
      const date = new Date(`${log.date}T12:00:00.000Z`);

      return {
        day: date.getUTCDate(),
        weekday: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][(date.getUTCDay() + 6) % 7],
        calories: log.total.calories,
        meals: log.mealCount,
        metTarget: log.total.calories <= log.calorieTarget,
        date: log.date,
      };
    });

    return {
      monthLabel: new Intl.DateTimeFormat('es-ES', { month: 'long' })
        .format(new Date(`${buildTodayDate()}T12:00:00.000Z`))
        .replace(/^./, (value) => value.toUpperCase()),
      logs,
      monthDays,
    };
  });
}
