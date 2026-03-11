export type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type Food = {
  id: string;
  userId: string;
  name: string;
  servingUnit: 'g' | 'ml' | 'unit';
  servingSize: number;
  per100g: MacroNutrients;
  createdAt: string;
};

export type FavoriteDishItem = {
  foodId: string;
  quantity: number;
  unit: 'g' | 'ml' | 'unit';
};

export type FavoriteDish = {
  id: string;
  userId: string;
  name: string;
  items: FavoriteDishItem[];
  createdAt: string;
};

export type MealLogEntry = {
  id: string;
  userId: string;
  consumedAt: string;
  source: 'manual' | 'favorite' | 'visual-analysis';
  total: MacroNutrients;
  notes?: string;
};

export type DailyNutritionLog = {
  id: string;
  userId: string;
  date: string;
  calorieTarget: number;
  mealCount: number;
  total: MacroNutrients;
  meals: MealLogEntry[];
};

export type WeightEntry = {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
};

export type NutritionLabelScanResult = {
  detectedName: string;
  servingSize: number;
  servingUnit: 'g' | 'ml' | 'unit';
  macrosPerServing: MacroNutrients;
  confidence: number;
};

export type VisualAnalysisItem = {
  detectedFoodName: string;
  estimatedQuantity: number;
  estimatedUnit: 'g' | 'ml' | 'unit';
  matchedFoodId?: string;
  estimatedMacros: MacroNutrients;
  confidence: number;
};

export type VisualAnalysisResult = {
  imageId: string;
  items: VisualAnalysisItem[];
  total: MacroNutrients;
};
