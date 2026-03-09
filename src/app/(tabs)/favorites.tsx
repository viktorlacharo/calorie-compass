import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { FavoriteDishCard } from '@/components/FavoriteDishCard';
import { mockFavoriteDishes, mockFoods } from '@/mocks/nutrition';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import type { MacroNutrients } from '@/types/nutrition';

/** Resolve a dish's total calories from the food catalog */
function getDishCalories(
  dishItems: { foodId: string; quantity: number; unit: string }[]
): number {
  const macrosList: MacroNutrients[] = [];
  for (const item of dishItems) {
    const food = mockFoods.find((f) => f.id === item.foodId);
    if (food) {
      macrosList.push(calculatePerServing(food.per100g, item.quantity));
    }
  }
  return sumMacros(macrosList).calories;
}

export default function FavoritesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* Header */}
      <View className="border-b border-border bg-surface px-5 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            FAVORITE DISHES
          </Text>
          <Text className="font-mono text-[10px] tabular-nums text-muted">
            {mockFavoriteDishes.length}{' '}
            {mockFavoriteDishes.length === 1 ? 'dish' : 'dishes'}
          </Text>
        </View>
      </View>

      <FlatList
        data={mockFavoriteDishes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 1 }}
        contentContainerStyle={{ flexGrow: 1, gap: 1 }}
        renderItem={({ item }) => (
          <View className="flex-1">
            <FavoriteDishCard
              dish={item}
              totalCalories={getDishCalories(item.items)}
              onPress={() => router.push(`/favorite/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-5 py-16">
            <Text className="font-sans-medium text-sm text-secondary">
              No favorite dishes yet
            </Text>
            <Text className="mt-1 text-center font-sans text-xs text-muted">
              Create combinations of foods you eat often for one-tap logging
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/favorite/create')}
        className="absolute bottom-6 right-5 h-12 w-12 items-center justify-center rounded-sm bg-primary active:bg-primary/90"
        accessibilityRole="button"
        accessibilityLabel="Create Favorite Dish"
      >
        <Plus size={20} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
}
