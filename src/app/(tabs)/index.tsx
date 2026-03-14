import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Camera, Plus, ScanLine, Sparkles, UtensilsCrossed } from 'lucide-react-native';
import { CalorieBudget } from '@/components/CalorieBudget';
import { GlassPanel } from '@/components/GlassPanel';
import { MealLogCard } from '@/components/MealLogCard';
import { NutriScore } from '@/components/NutriScore';
import { NutritionGrid } from '@/components/NutritionGrid';
import { CalorieBudgetSkeleton, DashboardInsightSkeleton, MealLogCardSkeleton, NutritionGridSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useDashboardQuery } from '@/features/logs/queries/use-logs-query';
import { calculateNutritionScore } from '@/utils/calculateNutritionScore';

export default function DailyLogScreen() {
  const geminiLogo = require('../../../assets/google-gemini.png');
  const { data, isLoading } = useDashboardQuery();
  const entries = data?.entries ?? [];
  const isInitialLoading = isLoading && !data;
  const totals = data?.totals ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const budget = data?.budget ?? 2200;
  const completion = Math.min(100, Math.round((totals.calories / budget) * 100));
  const nutritionScore = calculateNutritionScore(totals);
  const remainingCalories = data?.remainingCalories ?? Math.max(0, budget - totals.calories);
  const remainingProtein = data?.remainingProtein ?? Math.max(0, 165 - totals.protein);

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
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-sm text-secondary">Hola, Viktor</Text>
                <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
                  Inicio
                </Text>
              </View>
              <Link href="/settings" asChild>
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-full border-2 border-forest-line bg-forest-panelAlt active:opacity-85"
                  accessibilityRole="button"
                  accessibilityLabel="Abrir ajustes"
                >
                  <Text className="font-sans-bold text-base uppercase text-primary">VL</Text>
                </Pressable>
              </Link>
            </View>

            <Text className="mt-3 font-sans text-[12px] uppercase tracking-[2px] text-secondary">
              {dateLabel}
            </Text>

            {isInitialLoading ? (
              <CalorieBudgetSkeleton className="mt-6" />
            ) : (
              <CalorieBudget consumed={totals.calories} budget={budget} className="mt-6" />
            )}

            <View className="mt-6">
              <View className="mb-4 flex-row items-center gap-2">
                <Sparkles size={18} color="#EC5B13" strokeWidth={2} />
                <Text className="font-sans-bold text-xl text-primary">Desglose de macros</Text>
              </View>
              {isInitialLoading ? <NutritionGridSkeleton /> : <NutritionGrid macros={totals} size="md" />}
            </View>

            <View className="mt-16">
              <Text className="font-sans-bold text-xl text-primary">Acciones rapidas</Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                Lo principal de la app es registrar. Desde aqui puedes meter comidas, escanear o anadir datos a tu base.
              </Text>

              <Link href="/log/analyze" asChild>
                <Pressable
                  className="mt-4 overflow-hidden rounded-[28px] border border-border bg-brand px-5 py-5 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel="Analizar plato"
                >
                  <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-1">
                      <Text className="font-sans text-[11px] uppercase tracking-[2px] text-white/80">
                        Registro principal
                      </Text>
                      <Text className="mt-2 font-sans-bold text-[26px] leading-[28px] text-white">
                        Analizar plato
                      </Text>
                      <Text className="mt-2 font-sans text-sm leading-5 text-white/85">
                        Haz una foto y registra la comida desde tu base curada.
                      </Text>
                    </View>
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
                      <Camera size={24} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </View>
                </Pressable>
              </Link>

              <View className="mt-4 flex-row gap-3">
                <Link href="/food/scan" asChild>
                  <Pressable
                    className="flex-1 rounded-[24px] border border-border bg-surface px-4 py-4 active:opacity-90"
                    accessibilityRole="button"
                    accessibilityLabel="Escanear etiqueta"
                  >
                    <ScanLine size={18} color="#60A5FA" strokeWidth={2} />
                    <Text className="mt-4 font-sans-medium text-base text-primary">Escanear etiqueta</Text>
                    <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                      Saca macros de un alimento nuevo.
                    </Text>
                  </Pressable>
                </Link>

                <Link href="/favorite/create" asChild>
                  <Pressable
                    className="flex-1 rounded-[24px] border border-border bg-surface px-4 py-4 active:opacity-90"
                    accessibilityRole="button"
                    accessibilityLabel="Crear plato favorito"
                  >
                    <UtensilsCrossed size={18} color="#A7F3D0" strokeWidth={2} />
                    <Text className="mt-4 font-sans-medium text-base text-primary">Plato favorito</Text>
                    <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                      Guarda una combinacion que repitas.
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <Link href="/food/add" asChild>
                <Pressable
                  className="mt-3 flex-row items-center justify-between rounded-[24px] border border-border bg-forest-panelAlt px-4 py-4 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel="Anadir alimento"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-protein/10">
                      <Plus size={18} color="#EC5B13" strokeWidth={2} />
                    </View>
                    <View>
                      <Text className="font-sans-medium text-base text-primary">Anadir alimento</Text>
                      <Text className="mt-1 font-sans text-sm text-secondary">
                        Crea una entrada manual para tu catalogo.
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            </View>

            {isInitialLoading ? (
              <DashboardInsightSkeleton className="mt-6" />
            ) : (
              <GlassPanel className="mt-6 px-5 py-5">
                <NutriScore
                  score={nutritionScore}
                  macros={totals}
                  completion={completion}
                  remainingCalories={remainingCalories}
                  remainingProtein={remainingProtein}
                  description="Hoy vas bastante equilibrado y con buena proteina. Mantener esta precision en las comidas te lo pone facil."
                />

                <View className="mt-5 flex-row flex-wrap gap-2">
                  <View className="rounded-full border border-forest-line bg-forest-panelAlt px-3 py-2">
                    <Text className="font-sans text-xs text-primary">{entries.length} comidas registradas</Text>
                  </View>
                </View>

                <Link href="/ai/suggestions" asChild>
                  <Pressable
                    className="mt-5 rounded-[24px] bg-forest-panelAlt px-4 py-4 active:opacity-90"
                    accessibilityRole="button"
                    accessibilityLabel="Abrir sugerencias de que comer hoy"
                  >
                    <View className="flex-row items-center justify-between gap-4">
                      <View className="flex-1 flex-row items-center gap-3">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/90">
                          <Image source={geminiLogo} className="h-7 w-7" resizeMode="contain" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-sans-bold text-base text-primary">¿Qué como hoy?</Text>

                          <Text className="mt-1 font-sans text-sm leading-5 text-secondary">
                            Ideas guiadas por tu puntuacion nutricional y lo que queda del dia.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              </GlassPanel>
            )}

            <View className="mt-16 flex-row items-center justify-between">
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
        ListEmptyComponent={
          isInitialLoading ? (
            <View className="px-5 pt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <ScreenTransition key={index} delay={50 + index * 20} className={index === 0 ? '' : 'mt-4'}>
                  <MealLogCardSkeleton />
                </ScreenTransition>
              ))}
            </View>
          ) : entries.length === 0 ? (
            <View className="px-5 pt-4">
              <View className="rounded-[28px] border border-border bg-surface/80 px-5 py-5">
                <Text className="font-sans-medium text-base text-primary">Aun no hay comidas registradas hoy</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  Usa las acciones rapidas para registrar una comida, escanear una etiqueta o guardar un favorito.
                </Text>
              </View>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
