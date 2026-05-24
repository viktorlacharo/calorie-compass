import {
  createLog as createLogAws,
  getDashboard as getDashboardAws,
  getLogs as getLogsAws,
} from '@/lib/api/generated/aws-api';
import type { DashboardSummary as DashboardSummaryApi } from '@/lib/api/generated/model/dashboardSummary';
import type { MealLogEntry as MealLogEntryApi } from '@/lib/api/generated/model/mealLogEntry';
import { mockWeightEntries } from '@/mocks/nutrition';
import type { DailyNutritionLog, MealLogEntry, WeightEntry } from '@/types/nutrition';
import { sumMacros } from '@/utils/sumMacros';

type CreateMealLogInput = Omit<MealLogEntry, 'id' | 'userId' | 'consumedAt'> & {
  consumedAt?: string;
};

type DashboardSummary = {
  entries: MealLogEntry[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  budget: number;
  remainingCalories: number;
  remainingProtein: number;
};

type TimelineRange = 'week' | 'month';

function toMealLogEntry(item: MealLogEntryApi): MealLogEntry {
  return {
    id: item.id,
    userId: item.userId,
    consumedAt: item.consumedAt,
    source: item.source,
    total: item.total,
    favoriteDishId: item.favoriteDishId,
    notes: item.notes,
  };
}

function toDashboardSummary(summary: DashboardSummaryApi): DashboardSummary {
  return {
    entries: (summary.entries ?? []).map(toMealLogEntry),
    totals: summary.totals,
    budget: summary.budget,
    remainingCalories: summary.remainingCalories,
    remainingProtein: summary.remainingProtein,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await getDashboardAws();
  return toDashboardSummary(response);
}

export async function createMealLogEntry(input: CreateMealLogInput): Promise<MealLogEntry> {
  const response = await createLogAws({
    source: input.source,
    total: { ...input.total },
    favoriteDishId: input.favoriteDishId,
    notes: input.notes,
    consumedAt: input.consumedAt,
  });

  return toMealLogEntry(response.item);
}

export async function listMealLogEntries(startDate: string, endDate: string): Promise<MealLogEntry[]> {
  const response = await getLogsAws({ startDate, endDate });
  return (response.items ?? []).map(toMealLogEntry);
}

export async function listTodayMealLogEntries(): Promise<MealLogEntry[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  return listMealLogEntries(startOfDay.toISOString(), endOfDay.toISOString());
}

export async function getTimelineAnalytics(range: TimelineRange) {
  const endDateObj = new Date();
  const startDateObj = new Date();
  
  if (range === 'week') {
    startDateObj.setDate(endDateObj.getDate() - 6);
  } else {
    startDateObj.setDate(endDateObj.getDate() - 29);
  }
  
  startDateObj.setHours(0, 0, 0, 0);
  endDateObj.setHours(23, 59, 59, 999);
  
  const entries = await listMealLogEntries(startDateObj.toISOString(), endDateObj.toISOString());
  
  // Group by local YYYY-MM-DD
  const groups: { [date: string]: MealLogEntry[] } = {};
  
  // Create all days in the range to ensure zero calorie days are represented
  const dayCount = range === 'week' ? 7 : 30;
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(startDateObj);
    d.setDate(startDateObj.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    groups[dateStr] = [];
  }
  
  for (const entry of entries) {
    const dateObj = new Date(entry.consumedAt);
    const localDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    if (groups[localDate] !== undefined) {
      groups[localDate].push(entry);
    }
  }
  
  const logs: DailyNutritionLog[] = Object.keys(groups).map((date) => {
    const dayMeals = groups[date];
    const total = sumMacros(dayMeals.map((m) => m.total));
    return {
      id: `day_${date}`,
      userId: dayMeals[0]?.userId ?? 'user_001',
      date,
      calorieTarget: 2200,
      mealCount: dayMeals.length,
      total,
      meals: dayMeals.sort((a, b) => new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime()),
    };
  }).sort((a, b) => a.date.localeCompare(b.date)); // Chronological ascending
  
  const macroTotals = sumMacros(logs.map((log) => log.total));
  const calorieSeries = logs.map((log) => ({
    label:
      range === 'week'
        ? new Date(`${log.date}T12:00:00.000Z`).toLocaleDateString('es-ES', { weekday: 'short' })
        : String(new Date(`${log.date}T12:00:00.000Z`).getUTCDate()),
    value: log.total.calories,
  }));
  
  const average = (values: number[]) => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  
  const averageCalories = average(logs.map((log) => log.total.calories));
  const adherence = logs.length > 0
    ? Math.round((logs.filter((log) => log.total.calories <= log.calorieTarget).length / logs.length) * 100)
    : 100;
    
  const bestDay = logs.reduce((best, log) => {
    if (best.mealCount === 0 && log.mealCount > 0) return log;
    if (log.mealCount === 0) return best;
    return Math.abs(log.calorieTarget - log.total.calories) < Math.abs(best.calorieTarget - best.total.calories)
      ? log
      : best;
  }, logs[0]);
  
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
    bestDay: bestDay ?? {
      id: 'today',
      userId: 'user_001',
      date: new Date().toISOString().slice(0, 10),
      calorieTarget: 2200,
      mealCount: 0,
      total: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      meals: [],
    },
    mealCount: logs.reduce((sum, log) => sum + log.mealCount, 0),
    weightSeries,
    firstWeight,
    currentWeight,
    delta,
  };
}

export async function getCalendarMonth() {
  const now = new Date();
  const startOfMonthObj = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonthObj = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const entries = await listMealLogEntries(startOfMonthObj.toISOString(), endOfMonthObj.toISOString());
  
  const groups: { [date: string]: MealLogEntry[] } = {};
  const totalDaysInMonth = endOfMonthObj.getDate();
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    groups[dateStr] = [];
  }
  
  for (const entry of entries) {
    const dateObj = new Date(entry.consumedAt);
    const localDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    if (groups[localDate] !== undefined) {
      groups[localDate].push(entry);
    }
  }
  
  const logs: DailyNutritionLog[] = Object.keys(groups).map((date) => {
    const dayMeals = groups[date];
    const total = sumMacros(dayMeals.map((m) => m.total));
    return {
      id: `day_${date}`,
      userId: dayMeals[0]?.userId ?? 'user_001',
      date,
      calorieTarget: 2200,
      mealCount: dayMeals.length,
      total,
      meals: dayMeals.sort((a, b) => new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime()),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
  
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
      .format(now)
      .replace(/^./, (value) => value.toUpperCase()),
    logs,
    monthDays,
  };
}
