import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CalendarDays, ChartColumnBig, Scale } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChartCard, LineChartCard, MacroTrendCard } from '@/components/AnalyticsCharts';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { mockDailyNutritionLogs, mockWeightEntries, MOCK_DAILY_BUDGET } from '@/mocks/nutrition';
import { sumMacros } from '@/utils/sumMacros';

type RangeMode = 'week' | 'month';

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function TimelineScreen() {
  const [range, setRange] = useState<RangeMode>('week');

  const analytics = useMemo(() => {
    const logs = range === 'week' ? mockDailyNutritionLogs.slice(-7) : mockDailyNutritionLogs;
    const macroTotals = sumMacros(logs.map((log) => log.total));
    const calorieSeries = logs.map((log) => ({
      label: range === 'week' ? new Date(`${log.date}T12:00:00.000Z`).toLocaleDateString('es-ES', { weekday: 'short' }) : String(new Date(`${log.date}T12:00:00.000Z`).getUTCDate()),
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

    const weightSeriesSource =
      range === 'week' ? mockWeightEntries.slice(-4) : mockWeightEntries;
    const weightSeries = weightSeriesSource.map((entry) => ({
      label: range === 'week'
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
  }, [range]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={analytics.logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 36 }}
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
              <BarChartCard
                title="Progresion calorica"
                subtitle={`Consumo diario del ${range === 'week' ? 'rango semanal' : 'rango mensual'}. El objetivo se mantiene en ${MOCK_DAILY_BUDGET} kcal.`}
                points={analytics.calorieSeries}
                target={MOCK_DAILY_BUDGET}
                footer={`${analytics.averageCalories} kcal de media al dia - ${analytics.adherence}% de adherencia al objetivo`}
              />

              <GlassPanel className="px-5 py-5">
                <Text className="font-sans-bold text-xl text-primary">Resumen rapido</Text>
                <View className="mt-5 flex-row flex-wrap gap-3">
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Media kcal</Text>
                    <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.averageCalories}</Text>
                  </View>
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Comidas registradas</Text>
                    <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.mealCount}</Text>
                  </View>
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Mejor dia</Text>
                    <Text className="mt-2 font-sans-bold text-[28px] text-primary">
                      {new Date(`${analytics.bestDay.date}T12:00:00.000Z`).getUTCDate()}
                    </Text>
                  </View>
                </View>
              </GlassPanel>

              <MacroTrendCard
                title="Balance de macros"
                subtitle={`Consumo medio del ${range === 'week' ? 'rango semanal' : 'rango mensual'}.`}
                metrics={[
                  {
                    label: 'Proteina',
                    value: `${(analytics.macroTotals.protein / analytics.logs.length).toFixed(1)} g/dia`,
                    progress: (analytics.macroTotals.protein / analytics.logs.length / 150) * 100,
                    tone: 'text-protein',
                    fill: '#EC5B13',
                  },
                  {
                    label: 'Carbohidratos',
                    value: `${(analytics.macroTotals.carbs / analytics.logs.length).toFixed(1)} g/dia`,
                    progress: (analytics.macroTotals.carbs / analytics.logs.length / 220) * 100,
                    tone: 'text-carbs',
                    fill: '#60A5FA',
                  },
                  {
                    label: 'Grasas',
                    value: `${(analytics.macroTotals.fats / analytics.logs.length).toFixed(1)} g/dia`,
                    progress: (analytics.macroTotals.fats / analytics.logs.length / 70) * 100,
                    tone: 'text-fat',
                    fill: '#FBBF24',
                  },
                ]}
              />
            </View>

            <View className="mt-10 flex-row items-center gap-2">
              <Scale size={18} color="#A7F3D0" strokeWidth={2} />
              <Text className="font-sans-bold text-xl text-primary">Seguimiento del peso</Text>
            </View>

            <View className="mt-4 gap-4">
              <LineChartCard
                title="Peso corporal"
                subtitle={`Tendencia del ${range === 'week' ? 'rango semanal' : 'rango mensual'}.`}
                points={analytics.weightSeries}
                footer={`${analytics.firstWeight.toFixed(1)} kg -> ${analytics.currentWeight.toFixed(1)} kg - ${analytics.delta > 0 ? '+' : ''}${analytics.delta.toFixed(1)} kg netos`}
              />

              <GlassPanel className="px-5 py-5">
                <View className="flex-row flex-wrap gap-3">
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Inicio</Text>
                    <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.firstWeight.toFixed(1)}</Text>
                    <Text className="font-sans text-xs text-secondary">kg</Text>
                  </View>
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Actual</Text>
                    <Text className="mt-2 font-sans-bold text-[28px] text-primary">{analytics.currentWeight.toFixed(1)}</Text>
                    <Text className="font-sans text-xs text-secondary">kg</Text>
                  </View>
                  <View className="min-w-[31%] flex-1 rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">Cambio neto</Text>
                    <Text className={`mt-2 font-sans-bold text-[28px] ${analytics.delta <= 0 ? 'text-accent-green' : 'text-brand'}`}>
                      {analytics.delta > 0 ? '+' : ''}
                      {analytics.delta.toFixed(1)}
                    </Text>
                    <Text className="font-sans text-xs text-secondary">kg</Text>
                  </View>
                </View>
              </GlassPanel>
            </View>

            <View className="mt-10 flex-row items-center gap-2">
              <CalendarDays size={18} color="#60A5FA" strokeWidth={2} />
              <Text className="font-sans-bold text-xl text-primary">Registros e historial</Text>
            </View>

            <GlassPanel className="mt-4 px-5 py-5">
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
            </GlassPanel>
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
