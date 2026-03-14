import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CalendarDays, ChartColumnBig, Scale } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChartCard, MacroTrendCard } from '@/components/AnalyticsCharts';
import { GlassPanel } from '@/components/GlassPanel';
import { AnalyticsOverviewSkeleton, MealLogCardSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useTimelineQuery } from '@/features/logs/queries/use-logs-query';

type RangeMode = 'week' | 'month';

export default function TimelineScreen() {
  const [range, setRange] = useState<RangeMode>('week');
  const { data, isLoading } = useTimelineQuery(range);
  const isInitialLoading = isLoading && !data;
  const analytics = data ?? {
    logs: [],
    calorieSeries: [],
    macroTotals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    averageCalories: 0,
    adherence: 0,
    bestDay: { date: new Date().toISOString().slice(0, 10), calorieTarget: 2200, total: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
    mealCount: 0,
    weightSeries: [],
    firstWeight: 0,
    currentWeight: 0,
    delta: 0,
  };
  const logCount = analytics.logs.length;
  const averageProtein = logCount > 0 ? analytics.macroTotals.protein / logCount : 0;
  const averageCarbs = logCount > 0 ? analytics.macroTotals.carbs / logCount : 0;
  const averageFats = logCount > 0 ? analytics.macroTotals.fats / logCount : 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={analytics.logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-sm text-secondary">Todo tu historial nutricional</Text>
                <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
                  Historial
                </Text>
              </View>

              <View className="flex-row gap-2 rounded-full border border-border bg-forest-panelAlt p-1">
                <Pressable
                  onPress={() => setRange('week')}
                  className={`rounded-full px-4 py-2 ${range === 'week' ? 'bg-brand' : ''}`}
                >
                  <Text className={`font-sans-medium text-xs uppercase tracking-[1.3px] ${range === 'week' ? 'text-white' : 'text-secondary'}`}>
                    Semana
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRange('month')}
                  className={`rounded-full px-4 py-2 ${range === 'month' ? 'bg-brand' : ''}`}
                >
                  <Text className={`font-sans-medium text-xs uppercase tracking-[1.3px] ${range === 'month' ? 'text-white' : 'text-secondary'}`}>
                    Mes
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-8 flex-row items-center gap-2">
              <ChartColumnBig size={18} color="#EC5B13" strokeWidth={2} />
              <Text className="font-sans-bold text-xl text-primary">Graficos y estadisticas</Text>
            </View>

            <View className="mt-4 gap-4">
              {isInitialLoading ? (
                <AnalyticsOverviewSkeleton />
              ) : (
                <>
                  <BarChartCard
                    className="px-1"
                    title="Progresion calorica"
                    subtitle={`Consumo diario del ${range === 'week' ? 'rango semanal' : 'rango mensual'}. El objetivo se mantiene en 2200 kcal.`}
                    points={analytics.calorieSeries}
                    target={2200}
                    footer={`${analytics.averageCalories} kcal de media al dia - ${analytics.adherence}% de adherencia al objetivo`}
                  />

                  <View className="px-1 py-1">
                    <Text className="font-sans-bold text-xl text-primary">Resumen rapido</Text>
                    <View className="mt-5 gap-3">
                      <View className="px-1 py-1">
                        <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Media kcal</Text>
                        <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.averageCalories}</Text>
                      </View>
                      <View className="h-px bg-border" />
                      <View className="px-1 py-1">
                        <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Comidas registradas</Text>
                        <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.mealCount}</Text>
                      </View>
                      <View className="h-px bg-border" />
                      <View className="px-1 py-1">
                        <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Mejor dia</Text>
                        <Text className="mt-2 font-sans-bold text-[28px] text-primary">
                          {new Date(`${analytics.bestDay.date}T12:00:00.000Z`).getUTCDate()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <MacroTrendCard
                    className="px-1"
                    title="Balance de macros"
                    subtitle={`Consumo medio del ${range === 'week' ? 'rango semanal' : 'rango mensual'}.`}
                    metrics={[
                      {
                        label: 'Proteina',
                        value: `${averageProtein.toFixed(1)} g/dia`,
                        progress: (averageProtein / 150) * 100,
                        tone: 'text-protein',
                        fill: '#EC5B13',
                      },
                      {
                        label: 'Carbohidratos',
                        value: `${averageCarbs.toFixed(1)} g/dia`,
                        progress: (averageCarbs / 220) * 100,
                        tone: 'text-carbs',
                        fill: '#60A5FA',
                      },
                      {
                        label: 'Grasas',
                        value: `${averageFats.toFixed(1)} g/dia`,
                        progress: (averageFats / 70) * 100,
                        tone: 'text-fat',
                        fill: '#FBBF24',
                      },
                    ]}
                  />
                </>
              )}
            </View>

            


            <View className="mt-10 flex-row items-center gap-2">
              <CalendarDays size={18} color="#60A5FA" strokeWidth={2} />
              <Text className="font-sans-bold text-xl text-primary">Registros e historial</Text>
            </View>

            <View className="mt-4 px-1">
              <Text className="font-sans-bold text-xl text-primary">Registros mensuales</Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                Abre el calendario mensual para ver los dias registrados, sus totales y como ha ido evolucionando todo.
              </Text>

              <Link href="/history/calendar" asChild>
                <Pressable className="mt-5 rounded-full bg-brand px-5 py-4">
                  <Text className="text-center font-sans-medium text-sm uppercase tracking-[1.5px] text-white">
                    Abrir calendario de registros
                  </Text>
                </Pressable>
              </Link>
            </View>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={50} className={`mx-5 ${index === 0 ? '' : 'mt-3'}`}>
            <GlassPanel className="px-4 py-4">
              <View className="flex-row items-center justify-between gap-4">
                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-[1.5px] text-secondary">{item.date}</Text>
                  <Text className="mt-1 font-sans-bold text-lg text-primary">{item.total.calories} kcal</Text>
                </View>
                <View className="items-end">
                  <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-muted">Comidas</Text>
                  <Text className="mt-1 font-sans-medium text-sm text-primary">{item.mealCount}</Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2">
                <View className="rounded-full bg-protein/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-protein">P {item.total.protein}g</Text>
                </View>
                <View className="rounded-full bg-carbs/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-carbs">C {item.total.carbs}g</Text>
                </View>
                <View className="rounded-full bg-fat/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-fat">G {item.total.fats}g</Text>
                </View>
              </View>
            </GlassPanel>
          </ScreenTransition>
        )}
        ListEmptyComponent={
          isInitialLoading ? (
            <View className="px-5 pt-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <ScreenTransition key={index} delay={50 + index * 20} className={index === 0 ? '' : 'mt-3'}>
                  <MealLogCardSkeleton />
                </ScreenTransition>
              ))}
            </View>
          ) : analytics.logs.length === 0 ? (
            <View className="px-5 pt-4">
              <GlassPanel className="px-5 py-5">
                <Text className="font-sans-medium text-base text-primary">Aun no hay historial en este rango</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  Cambia el periodo o registra nuevas comidas para empezar a ver estadisticas aqui.
                </Text>
              </GlassPanel>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
