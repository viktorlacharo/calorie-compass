export type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type Supermarket = 'carrefour' | 'mercadona' | 'lidl' | 'aldi' | 'eroski';

export type Food = {
  id: string;
  userId?: string;
  name: string;
  barcode?: string | null;
  brand?: string | null;
  referenceAmount: number;
  referenceUnit?: 'g';
  referenceMacros: MacroNutrients;
  defaultServingAmount?: number | null;
  supermarket?: Supermarket | null;
  createdAt: string;
  updatedAt?: string;
};

export type FavoriteDishItem = {
  foodId: string;
  quantity: number;
};

export type FavoriteDish = {
  id: string;
  userId: string;
  name: string;
  description: string;
  imageUri: string;
  prepMinutes: number;
  difficulty: 'Facil' | 'Media' | 'Alta';
  servings: number;
  tags: string[];
  steps: string[];
  items: FavoriteDishItem[];
  createdAt: string;
};

export type MealLogEntry = {
  id: string;
  userId: string;
  consumedAt: string;
  source: 'manual' | 'favorite' | 'visual-analysis';
  total: MacroNutrients;
  favoriteDishId?: string;
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
  referenceAmount: number;
  referenceMacros: MacroNutrients;
  defaultServingAmount?: number;
  confidence: number;
};

export type VisualAnalysisItem = {
  detectedFoodName: string;
  estimatedQuantity: number;
  matchedFoodId?: string;
  estimatedMacros: MacroNutrients;
  confidence: number;
};

export type VisualAnalysisResult = {
  imageId: string;
  items: VisualAnalysisItem[];
  total: MacroNutrients;
};

export type MealSuggestionMode = 'craving' | 'recommended' | 'alternate';

export type MealSuggestionFocus =
  | 'quick'
  | 'protein'
  | 'snack'
  | 'light-dinner'
  | 'dessert-fit';

export type MealSuggestion = {
  id: string;
  title: string;
  description: string;
  whyItFits: string;
  estimatedCalories: number;
  estimatedMacros: MacroNutrients;
  items: FavoriteDishItem[];
  foodNames: string[];
  sourceKind: 'foods-only' | 'favorite-adaptation';
  sourceLabel: string;
  basedOnFavoriteId?: string;
};

export type MealSuggestionRequest = {
  mode: MealSuggestionMode;
  focus?: MealSuggestionFocus;
  nutritionScore: number;
  todayMeals: MealLogEntry[];
  todayTotals: MacroNutrients;
  dailyCalorieTarget: number;
  dailyMacroTarget: MacroNutrients;
  remainingCalories: number;
  remainingMacros: MacroNutrients;
  foodsCatalog: Food[];
  favoriteDishes: FavoriteDish[];
};

export type MealSuggestionResponse = {
  assistantIntro: string;
  assistantFollowUp: string;
  suggestions: MealSuggestion[];
};

export type AiRecipeDraft = {
  draftId: string;
  suggestionId: string;
  title: string;
  description: string;
  whyItFits: string;
  items: FavoriteDishItem[];
  estimatedMacros: MacroNutrients;
  estimatedCalories: number;
  modeLabel: string;
  sourceLabel: string;
  tags: string[];
  steps: string[];
};
