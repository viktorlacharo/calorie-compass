import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { mockDailyNutritionLogs } from '@/mocks/nutrition';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export default function CalendarHistoryScreen() {
  const monthDays = mockDailyNutritionLogs.map((log) => {
    const date = new Date(`${log.date}T12:00:00.000Z`);
    return {
      day: date.getUTCDate(),
      weekday: WEEKDAY_LABELS[(date.getUTCDay() + 6) % 7],
      calories: log.total.calories,
      meals: log.mealCount,
      metTarget: log.total.calories <= log.calorieTarget,
      date: log.date,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={mockDailyNutritionLogs}
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
              <Text className="font-sans-bold text-xl text-primary">Registros de marzo</Text>
              <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
                <Text className="font-sans text-xs text-primary">31</Text>
              </View>
            </View>

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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
