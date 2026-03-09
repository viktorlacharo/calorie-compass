import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Camera } from 'lucide-react-native';
import { CalorieBudget } from '@/components/CalorieBudget';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { MealLogCard } from '@/components/MealLogCard';
import { Separator } from '@/components/ui/separator';
import { sumMacros } from '@/utils/sumMacros';
import {
  mockMealLogEntries,
  MOCK_DAILY_BUDGET,
} from '@/mocks/nutrition';

export default function DailyLogScreen() {
  const router = useRouter();
  const entries = mockMealLogEntries;
  const totals = sumMacros(entries.map((e) => e.total));

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5">
            {/* Date header */}
            <View className="flex-row items-center justify-between pb-4 pt-2">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                {dateLabel}
              </Text>
              <Text className="font-sans text-[10px] tracking-widest uppercase text-muted">
                TODAY
              </Text>
            </View>

            {/* Calorie budget ring */}
            <CalorieBudget
              consumed={totals.calories}
              budget={MOCK_DAILY_BUDGET}
              className="py-4"
            />

            <Separator className="my-4" />

            {/* Macro grid */}
            <NutritionGrid macros={totals} size="md" className="px-2" />

            {/* Macro ratio bar */}
            <MacroBar macros={totals} className="mt-4 px-2" />

            <Separator className="my-4" />

            {/* Meals section header */}
            <Text className="mb-2 font-sans text-[10px] tracking-widest uppercase text-secondary">
              MEALS
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <MealLogCard
            entry={item}
            className={index === 0 ? 'border-t' : 'border-t-0'}
          />
        )}
        ListEmptyComponent={
          <View className="items-center px-5 py-12">
            <Text className="font-sans-medium text-sm text-secondary">
              No meals logged today
            </Text>
            <Text className="mt-1 font-sans text-xs text-muted">
              Tap the + button to log your first meal
            </Text>
          </View>
        }
        ListFooterComponent={<View className="h-24" />}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB row */}
      <View className="absolute bottom-6 right-5 flex-row gap-3">
        <Pressable
          onPress={() => router.push('/log/analyze')}
          className="h-12 w-12 items-center justify-center rounded-sm border border-border bg-surface active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Analyze Plate with Camera"
        >
          <Camera size={20} color="#0C0A09" strokeWidth={1.6} />
        </Pressable>
        <Pressable
          onPress={() => {
            // TODO: open meal logging flow
          }}
          className="h-12 w-12 items-center justify-center rounded-sm bg-primary active:bg-primary/90"
          accessibilityRole="button"
          accessibilityLabel="Log New Meal"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
