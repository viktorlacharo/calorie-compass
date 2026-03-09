import type {
  FavoriteDish,
  Food,
  MealLogEntry,
  NutritionLabelScanResult,
  VisualAnalysisResult,
} from '../types/nutrition';

// ── Foods ────────────────────────────────────────────────────────────

export const mockFoods: Food[] = [
  {
    id: 'food_001',
    userId: 'user_001',
    name: 'Chicken Breast',
    servingUnit: 'g',
    servingSize: 150,
    per100g: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 'food_002',
    userId: 'user_001',
    name: 'Brown Rice',
    servingUnit: 'g',
    servingSize: 120,
    per100g: { calories: 112, protein: 2.6, carbs: 23.5, fats: 0.9 },
    createdAt: '2026-03-01T09:05:00.000Z',
  },
  {
    id: 'food_003',
    userId: 'user_001',
    name: 'Broccoli',
    servingUnit: 'g',
    servingSize: 100,
    per100g: { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
    createdAt: '2026-03-02T10:00:00.000Z',
  },
  {
    id: 'food_004',
    userId: 'user_001',
    name: 'Extra Virgin Olive Oil',
    servingUnit: 'ml',
    servingSize: 15,
    per100g: { calories: 884, protein: 0, carbs: 0, fats: 100 },
    createdAt: '2026-03-02T10:05:00.000Z',
  },
  {
    id: 'food_005',
    userId: 'user_001',
    name: 'Greek Yogurt 0%',
    servingUnit: 'g',
    servingSize: 170,
    per100g: { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
    createdAt: '2026-03-03T08:00:00.000Z',
  },
  {
    id: 'food_006',
    userId: 'user_001',
    name: 'Whole Eggs',
    servingUnit: 'unit',
    servingSize: 1,
    per100g: { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
    createdAt: '2026-03-03T08:05:00.000Z',
  },
  {
    id: 'food_007',
    userId: 'user_001',
    name: 'Banana',
    servingUnit: 'unit',
    servingSize: 1,
    per100g: { calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3 },
    createdAt: '2026-03-04T07:30:00.000Z',
  },
  {
    id: 'food_008',
    userId: 'user_001',
    name: 'Oats',
    servingUnit: 'g',
    servingSize: 50,
    per100g: { calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9 },
    createdAt: '2026-03-04T07:35:00.000Z',
  },
  {
    id: 'food_009',
    userId: 'user_001',
    name: 'Salmon Fillet',
    servingUnit: 'g',
    servingSize: 180,
    per100g: { calories: 208, protein: 20, carbs: 0, fats: 13 },
    createdAt: '2026-03-05T12:00:00.000Z',
  },
  {
    id: 'food_010',
    userId: 'user_001',
    name: 'Sweet Potato',
    servingUnit: 'g',
    servingSize: 200,
    per100g: { calories: 86, protein: 1.6, carbs: 20.1, fats: 0.1 },
    createdAt: '2026-03-05T12:05:00.000Z',
  },
];

// Keep backward-compat single export
export const mockFood: Food = mockFoods[0];

// ── Favorite Dishes ──────────────────────────────────────────────────

export const mockFavoriteDishes: FavoriteDish[] = [
  {
    id: 'dish_001',
    userId: 'user_001',
    name: 'Lunch Bowl',
    items: [
      { foodId: 'food_001', quantity: 150, unit: 'g' },
      { foodId: 'food_002', quantity: 120, unit: 'g' },
      { foodId: 'food_003', quantity: 100, unit: 'g' },
      { foodId: 'food_004', quantity: 10, unit: 'ml' },
    ],
    createdAt: '2026-03-06T09:10:00.000Z',
  },
  {
    id: 'dish_002',
    userId: 'user_001',
    name: 'Breakfast Oats',
    items: [
      { foodId: 'food_008', quantity: 50, unit: 'g' },
      { foodId: 'food_005', quantity: 170, unit: 'g' },
      { foodId: 'food_007', quantity: 1, unit: 'unit' },
    ],
    createdAt: '2026-03-06T09:15:00.000Z',
  },
  {
    id: 'dish_003',
    userId: 'user_001',
    name: 'Salmon Dinner',
    items: [
      { foodId: 'food_009', quantity: 180, unit: 'g' },
      { foodId: 'food_010', quantity: 200, unit: 'g' },
      { foodId: 'food_003', quantity: 80, unit: 'g' },
    ],
    createdAt: '2026-03-07T18:00:00.000Z',
  },
];

export const mockFavoriteDish: FavoriteDish = mockFavoriteDishes[0];

// ── Meal Log Entries (today) ─────────────────────────────────────────

export const mockMealLogEntries: MealLogEntry[] = [
  {
    id: 'log_001',
    userId: 'user_001',
    consumedAt: '2026-03-09T07:30:00.000Z',
    source: 'favorite',
    total: { calories: 485, protein: 27.4, carbs: 59.2, fats: 14.8 },
    notes: 'Breakfast Oats',
  },
  {
    id: 'log_002',
    userId: 'user_001',
    consumedAt: '2026-03-09T13:00:00.000Z',
    source: 'favorite',
    total: { calories: 420, protein: 52.1, carbs: 35.2, fats: 8.2 },
    notes: 'Lunch Bowl',
  },
  {
    id: 'log_003',
    userId: 'user_001',
    consumedAt: '2026-03-09T16:00:00.000Z',
    source: 'manual',
    total: { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
    notes: '2 boiled eggs',
  },
  {
    id: 'log_004',
    userId: 'user_001',
    consumedAt: '2026-03-09T20:00:00.000Z',
    source: 'visual-analysis',
    total: { calories: 574, protein: 38.4, carbs: 42.4, fats: 26.4 },
    notes: 'Salmon dinner (AI detected)',
  },
];

export const mockMealLogEntry: MealLogEntry = mockMealLogEntries[0];

// ── Daily budget ─────────────────────────────────────────────────────

export const MOCK_DAILY_BUDGET = 2200;

// ── Scan Results ─────────────────────────────────────────────────────

export const mockNutritionLabelScan: NutritionLabelScanResult = {
  detectedName: 'Greek Yogurt',
  servingSize: 170,
  servingUnit: 'g',
  macrosPerServing: { calories: 120, protein: 17, carbs: 6, fats: 0 },
  confidence: 0.93,
};

export const mockVisualAnalysis: VisualAnalysisResult = {
  imageId: 'img_001',
  items: [
    {
      detectedFoodName: 'Grilled Chicken',
      estimatedQuantity: 140,
      estimatedUnit: 'g',
      matchedFoodId: 'food_001',
      estimatedMacros: { calories: 231, protein: 43.4, carbs: 0, fats: 5 },
      confidence: 0.88,
    },
    {
      detectedFoodName: 'Brown Rice',
      estimatedQuantity: 150,
      estimatedUnit: 'g',
      matchedFoodId: 'food_002',
      estimatedMacros: { calories: 168, protein: 3.9, carbs: 35.3, fats: 1.4 },
      confidence: 0.82,
    },
    {
      detectedFoodName: 'Steamed Broccoli',
      estimatedQuantity: 80,
      estimatedUnit: 'g',
      matchedFoodId: 'food_003',
      estimatedMacros: { calories: 27, protein: 2.2, carbs: 5.6, fats: 0.3 },
      confidence: 0.91,
    },
  ],
  total: { calories: 426, protein: 49.5, carbs: 40.9, fats: 6.7 },
};
