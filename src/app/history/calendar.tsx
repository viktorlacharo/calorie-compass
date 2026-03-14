import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarGridSkeleton, MealLogCardSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useCalendarQuery } from '@/features/logs/queries/use-logs-query';

export default function CalendarHistoryScreen() {
  const { data, isLoading } = useCalendarQuery();
  const isInitialLoading = isLoading && !data;
  const logs = data?.logs ?? [];
  const monthDays = data?.monthDays ?? [];
  const monthLabel = data?.monthLabel ?? 'Mes';

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 48 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <View className="flex-row items-center justify-between">
              <Link href="/timeline" asChild>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
                  <Text className="text-primary">{'<'}</Text>
                </Pressable>
              </Link>
              {isInitialLoading ? (
                <SkeletonBlock className="h-6 w-44 rounded-full" />
              ) : (
                <Text className="font-sans-bold text-xl text-primary">Registros de {monthLabel}</Text>
              )}
              <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
                {isInitialLoading ? (
                  <SkeletonBlock className="h-3 w-4 rounded-full" />
                ) : (
                  <Text className="font-sans text-xs text-primary">{monthDays.length}</Text>
                )}
              </View>
            </View>

            {isInitialLoading ? (
              <CalendarGridSkeleton className="mt-6" />
            ) : (
              <GlassPanel className="mt-6 px-4 py-4">
                <Text className="font-sans text-[11px] uppercase tracking-[2px] text-secondary">
                  Calendario mensual
                </Text>
                <Text className="mt-2 font-sans text-sm leading-5 text-secondary">
                  Una vista rapida para ver que dias registraste y como se movio tu ingesta durante el mes.
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  {monthDays.map((day) => (
                    <View
                      key={day.date}
                      className={`w-[13.4%] min-w-[44px] rounded-2xl border px-2 py-3 ${day.metTarget ? 'border-accent-green/30 bg-accent-green/10' : 'border-brand/30 bg-brand/10'}`}
                    >
                      <Text className="font-sans text-[10px] uppercase tracking-[1px] text-secondary">{day.weekday}</Text>
                      <Text className="mt-1 font-sans-bold text-base text-primary">{day.day}</Text>
                    </View>
                  ))}
                </View>
              </GlassPanel>
            )}

            <Text className="mt-8 font-sans-bold text-xl text-primary">Registros diarios</Text>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-3'}`}>
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
          ) : logs.length === 0 ? (
            <View className="px-5 pt-4">
              <GlassPanel className="px-5 py-5">
                <Text className="font-sans-medium text-base text-primary">No hay registros para este mes</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  Cuando registres comidas, apareceran aqui con su resumen diario.
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
