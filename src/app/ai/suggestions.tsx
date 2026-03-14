import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { AssistantMessage } from '@/components/AssistantMessage';
import { MealSuggestionCard } from '@/components/MealSuggestionCard';
import { NutriScore } from '@/components/NutriScore';
import { QuickPromptChips } from '@/components/QuickPromptChips';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import { useFavoritesQuery } from '@/features/favorites/queries/use-favorites-query';
import { useTodayEntriesQuery } from '@/features/logs/queries/use-logs-query';
import { aiQueryKeys } from '@/features/ai/queries/ai.query-keys';
import { AI_DAILY_BUDGET, AI_DAILY_MACRO_TARGET } from '@/features/ai/services/ai.mock-backend';
import { useCreateRecipeDraftMutation, useMealSuggestionsMutation } from '@/features/ai/queries/use-ai-query';
import { calculateNutritionScore } from '@/utils/calculateNutritionScore';
import { sumMacros } from '@/utils/sumMacros';
import type {
  MealSuggestionFocus,
  MealSuggestionMode,
  MealSuggestionRequest,
  MealSuggestionResponse,
} from '@/types/nutrition';

type SuggestionScreenState = 'chooser' | 'alternate-focus' | 'loading' | 'result';

const geminiLogo = require('../../../assets/google-gemini.png');

const MODE_OPTIONS: Array<{
  value: MealSuggestionMode;
  title: string;
  description: string;
}> = [
  {
    value: 'craving',
    title: 'Estoy golos@',
    description: 'Ideas mas apetecibles, pero siempre construidas con lo que ya has guardado.',
  },
  {
    value: 'recommended',
    title: 'Lo recomendado para hoy',
    description: 'La opcion mas alineada con tu dia real y tu catalogo actual.',
  },
  {
    value: 'alternate',
    title: 'Sugiereme otro enfoque',
    description: 'Eliges una via concreta y la afino sin salir de tus alimentos.',
  },
];

const FOCUS_OPTIONS: Array<{ value: MealSuggestionFocus; label: string }> = [
  { value: 'quick', label: 'algo rapido' },
  { value: 'protein', label: 'mas proteina' },
  { value: 'snack', label: 'snack' },
  { value: 'light-dinner', label: 'cena ligera' },
  { value: 'dessert-fit', label: 'me apetece dulce' },
];

export default function MealSuggestionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: foods = [] } = useFoodsQuery('');
  const { data: favoriteDishes = [] } = useFavoritesQuery();
  const { data: mealLogEntries = [] } = useTodayEntriesQuery();
  const mealSuggestionsMutation = useMealSuggestionsMutation();
  const createRecipeDraftMutation = useCreateRecipeDraftMutation();
  const [screenState, setScreenState] = useState<SuggestionScreenState>('chooser');
  const [selectedMode, setSelectedMode] = useState<MealSuggestionMode | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<MealSuggestionFocus | undefined>(undefined);
  const [response, setResponse] = useState<MealSuggestionResponse | null>(null);

  const todayTotals = useMemo(() => sumMacros(mealLogEntries.map((entry) => entry.total)), [mealLogEntries]);
  const completion = Math.min(100, Math.round((todayTotals.calories / AI_DAILY_BUDGET) * 100));
  const nutritionScore = calculateNutritionScore(todayTotals);

  const remainingCalories = Math.max(0, AI_DAILY_BUDGET - todayTotals.calories);
  const remainingMacros = {
    calories: remainingCalories,
    protein: Math.max(0, AI_DAILY_MACRO_TARGET.protein - todayTotals.protein),
    carbs: Math.max(0, AI_DAILY_MACRO_TARGET.carbs - todayTotals.carbs),
    fats: Math.max(0, AI_DAILY_MACRO_TARGET.fats - todayTotals.fats),
  };

  const selectedModeMeta = MODE_OPTIONS.find((option) => option.value === selectedMode);

  function handleModeSelect(mode: MealSuggestionMode) {
    if (mode === 'alternate') {
      setSelectedMode(mode);
      setSelectedFocus(undefined);
      setResponse(null);
      setScreenState('alternate-focus');
      return;
    }

    void requestSuggestions(mode);
  }

  async function requestSuggestions(mode: MealSuggestionMode, focus?: MealSuggestionFocus) {
    const payload: MealSuggestionRequest = {
      mode,
      focus,
      nutritionScore,
      todayMeals: mealLogEntries,
      todayTotals,
      dailyCalorieTarget: AI_DAILY_BUDGET,
      dailyMacroTarget: AI_DAILY_MACRO_TARGET,
      remainingCalories,
      remainingMacros,
      foodsCatalog: foods,
      favoriteDishes,
    };

    setSelectedMode(mode);
    setSelectedFocus(focus);
    setScreenState('loading');

    const nextResponse = await mealSuggestionsMutation.mutateAsync(payload);
    setResponse(nextResponse);
    setScreenState('result');
  }

  function handleReset() {
    setResponse(null);
    setSelectedMode(null);
    setSelectedFocus(undefined);
    setScreenState('chooser');
    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });
  }

  async function handleConvertToRecipe(suggestion: NonNullable<MealSuggestionResponse>['suggestions'][number]) {
    await createRecipeDraftMutation.mutateAsync({
      suggestion,
      modeLabel: selectedModeMeta?.title ?? 'Sugerencia AI',
      foodsCatalog: foods,
    });

    router.push('/favorite/create');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Volver atras"
        >
          <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">SUGERENCIAS AI</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 44 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition className="px-5 pt-5">
          <Text className="font-sans text-sm text-secondary">Ideas guiadas segun como va tu dia</Text>
          <View className="mt-1 flex-row items-start justify-between gap-4">
            <View className="flex-1 pr-2">
              <Text className="font-sans-bold text-[31px] leading-[34px] text-primary">Que comemos hoy</Text>
              <Text className="mt-4 font-sans text-sm leading-6 text-secondary">
                Esta vista propone solo ideas construidas con tu catalogo y tus platos guardados. No inventa ingredientes externos.
              </Text>
            </View>

            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/8">
              <Image source={geminiLogo} className="h-8 w-8" resizeMode="contain" />
            </View>
          </View>
        </ScreenTransition>

        <ScreenTransition delay={40} className="px-5 pt-6">
          <NutriScore
            score={nutritionScore}
            macros={todayTotals}
            completion={completion}
            remainingCalories={remainingCalories}
            remainingProtein={remainingMacros.protein}
            description="El contexto del dia y tu propio catalogo son lo unico que usamos para construir sugerencias utiles."
          />
        </ScreenTransition>

        {screenState === 'chooser' ? (
          <>
            <ScreenTransition delay={70} className="px-5 pt-6">
              <Text className="font-sans text-[11px] uppercase tracking-[1.8px] text-secondary">Elige el tipo de sugerencia</Text>
            </ScreenTransition>

            <View className="gap-3 px-5 pt-4">
              {MODE_OPTIONS.map((option, index) => (
                <ScreenTransition key={option.value} delay={100 + index * 30}>
                  <Pressable
                    onPress={() => handleModeSelect(option.value)}
                    className="rounded-[30px] bg-surface px-5 py-5 active:opacity-90"
                    accessibilityRole="button"
                    accessibilityLabel={option.title}
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1 pr-2">
                        <Text className="font-sans-bold text-[22px] leading-7 text-primary">{option.title}</Text>
                        <Text className="mt-2 font-sans text-sm leading-6 text-secondary">{option.description}</Text>
                      </View>
                      <View className="h-12 w-12 items-center justify-center rounded-full bg-forest-panelAlt">
                        <Sparkles size={18} color="#A9B8A8" strokeWidth={2} />
                      </View>
                    </View>
                  </Pressable>
                </ScreenTransition>
              ))}
            </View>
          </>
        ) : null}

        {screenState === 'alternate-focus' ? (
          <>
            <ScreenTransition delay={70} className="px-5 pt-6">
              <Text className="font-sans text-[11px] uppercase tracking-[1.8px] text-secondary">Otro enfoque</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Elige una direccion concreta y afinamos mejor la propuesta sin salir de tus alimentos guardados.
              </Text>
            </ScreenTransition>

            <ScreenTransition delay={100} className="px-5 pt-4">
              <QuickPromptChips options={FOCUS_OPTIONS} onSelect={(value) => requestSuggestions('alternate', value)} />
            </ScreenTransition>

            <ScreenTransition delay={140} className="px-5 pt-6">
              <Button variant="outline" onPress={handleReset} accessibilityLabel="Volver a tipos de sugerencia">
                <UIText>Volver a tipos de sugerencia</UIText>
              </Button>
            </ScreenTransition>
          </>
        ) : null}

        {screenState === 'loading' ? (
          <ScreenTransition delay={80} className="px-5 pt-6">
            <AssistantMessage
              title="Preparando ideas"
              message="Estamos consultando una propuesta basada solo en tu catalogo y tu progreso de hoy."
              visual="loading"
            />
          </ScreenTransition>
        ) : null}

        {screenState === 'result' && response ? (
          <>
            <ScreenTransition delay={80} className="px-5 pt-6">
              <AssistantMessage title={selectedModeMeta?.title ?? 'Sugerencias listas'} message={response.assistantIntro} />
            </ScreenTransition>

            {selectedMode === 'alternate' ? (
              <ScreenTransition delay={160} className="px-5 pt-6">
                <Text className="font-sans text-[11px] uppercase tracking-[1.8px] text-secondary">Ajustar enfoque</Text>
                <View className="mt-4">
                  <QuickPromptChips options={FOCUS_OPTIONS} selectedValue={selectedFocus} onSelect={(value) => requestSuggestions('alternate', value)} />
                </View>
              </ScreenTransition>
            ) : null}

            {response.suggestions.length > 0 ? (
              <View className={`gap-4 px-5 ${selectedMode === 'alternate' ? 'pt-6' : 'pt-8'}`}>
                {response.suggestions.map((suggestion, index) => {
                  const projectedScore = calculateNutritionScore(sumMacros([todayTotals, suggestion.estimatedMacros]));

                  return (
                    <ScreenTransition key={suggestion.id} delay={190 + index * 35}>
                      <MealSuggestionCard
                        suggestion={suggestion}
                        currentScore={nutritionScore}
                        projectedScore={projectedScore}
                        scoreDelta={projectedScore - nutritionScore}
                        currentRemainingCalories={remainingCalories}
                        currentRemainingProtein={remainingMacros.protein}
                        projectedRemainingCalories={Math.max(0, remainingCalories - suggestion.estimatedMacros.calories)}
                        projectedRemainingProtein={Math.max(0, remainingMacros.protein - suggestion.estimatedMacros.protein)}
                        onConvertToRecipe={() => void handleConvertToRecipe(suggestion)}
                      />
                    </ScreenTransition>
                  );
                })}
              </View>
            ) : (
              <ScreenTransition delay={190} className="px-5 pt-6">
                <View className="rounded-[28px] bg-surface px-5 py-5">
                  <Text className="font-sans-medium text-base text-primary">Tu catalogo todavia es corto para este enfoque</Text>
                  <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                    Anade mas alimentos o platos base para que podamos generar mejores combinaciones sin salir de tu sistema.
                  </Text>
                </View>
              </ScreenTransition>
            )}

            <ScreenTransition delay={280} className="px-5 pt-6">
              <Separator />
              <View className="mt-6 gap-3">
                <Button variant="secondary" onPress={() => void requestSuggestions(selectedMode ?? 'recommended', selectedFocus)} accessibilityLabel="Generar otras ideas">
                  <UIText>Generar otras ideas</UIText>
                </Button>
                <Button variant="outline" onPress={handleReset} accessibilityLabel="Cambiar enfoque de sugerencia">
                  <UIText>Cambiar enfoque</UIText>
                </Button>
              </View>
            </ScreenTransition>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
