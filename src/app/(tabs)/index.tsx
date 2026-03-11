import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { CalorieBudget } from '@/components/CalorieBudget';
import { GlassPanel } from '@/components/GlassPanel';
import { MacroBar } from '@/components/MacroBar';
import { MealLogCard } from '@/components/MealLogCard';
import { NutritionGrid } from '@/components/NutritionGrid';
import { ScreenTransition } from '@/components/ScreenTransition';
import { MOCK_DAILY_BUDGET, mockMealLogEntries } from '@/mocks/nutrition';
import { sumMacros } from '@/utils/sumMacros';

export default function DailyLogScreen() {
  const entries = mockMealLogEntries;
  const totals = sumMacros(entries.map((e) => e.total));
  const completion = Math.min(100, Math.round((totals.calories / MOCK_DAILY_BUDGET) * 100));
  const nutritionScore = Math.max(
    62,
    Math.min(
      96,
      Math.round(
        78 +
          Math.min(12, totals.protein / 12) +
          Math.min(6, totals.carbs / 45) +
          Math.max(0, 6 - Math.abs(totals.fats - 55) / 4)
      )
    )
  );

  const dateLabel = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date()).replace(/^./, (m) => m.toUpperCase());

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 36 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-sm text-secondary">Hola, Viktor</Text>
                <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
                  Inicio
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-forest-line bg-forest-panelAlt">
                <Text className="font-sans-bold text-base text-primary">VC</Text>
              </View>
            </View>

            <Text className="mt-3 font-sans text-[12px] uppercase tracking-[2px] text-secondary">
              {dateLabel}
            </Text>

            <CalorieBudget consumed={totals.calories} budget={MOCK_DAILY_BUDGET} className="mt-6" />

            <View className="mt-6">
              <View className="mb-4 flex-row items-center gap-2">
                <Sparkles size={18} color="#EC5B13" strokeWidth={2} />
                <Text className="font-sans-bold text-xl text-primary">Desglose de macros</Text>
              </View>
              <NutritionGrid macros={totals} size="md" />
            </View>

            <GlassPanel className="mt-6 px-5 py-5">
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 pr-2">
                  <Text className="font-sans-bold text-xl text-primary">Puntuacion nutricional</Text>
                  <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                    Hoy vas bastante equilibrado y con buena proteina. Mantener esta precision en las comidas te lo pone facil.
                  </Text>
                </View>
                <View className="h-24 w-24 items-center justify-center rounded-full border-[6px] border-accent-green/20 bg-forest-panelAlt">
                  <Text className="font-sans-bold text-[28px] text-primary">{nutritionScore}</Text>
                  <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">
                    Bien
                  </Text>
                </View>
              </View>

              <View className="mt-5">
                <MacroBar macros={totals} />
              </View>

              <View className="mt-5 flex-row flex-wrap gap-2">
                <View className="rounded-full border border-forest-line bg-forest-panelAlt px-3 py-2">
                  <Text className="font-sans text-xs text-primary">{completion}% del objetivo calorico</Text>
                </View>
                <View className="rounded-full border border-forest-line bg-forest-panelAlt px-3 py-2">
                  <Text className="font-sans text-xs text-primary">{entries.length} comidas registradas</Text>
                </View>
              </View>
            </GlassPanel>

            <View className="mt-8 flex-row items-center justify-between">
              <Text className="font-sans-bold text-xl text-primary">Comidas de hoy</Text>
              <Link href="/timeline" asChild>
                <Pressable>
                  <Text className="font-sans-medium text-xs uppercase tracking-[1.6px] text-brand">
                    Ver historial
                  </Text>
                </Pressable>
              </Link>
            </View>
          </ScreenTransition>
        }
        renderItem={({ item }) => (
          <ScreenTransition delay={50} className="mb-4 mx-5">
            <MealLogCard entry={item} href="/timeline" />
          </ScreenTransition>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
