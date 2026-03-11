import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavoriteDishCard } from '@/components/FavoriteDishCard';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { mockFavoriteDishes, mockFoods } from '@/mocks/nutrition';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import type { MacroNutrients } from '@/types/nutrition';

function getDishTotals(dishItems: { foodId: string; quantity: number; unit: string }[]) {
  const macrosList: MacroNutrients[] = [];

  for (const item of dishItems) {
    const food = mockFoods.find((entry) => entry.id === item.foodId);
    if (food) {
      macrosList.push(calculatePerServing(food.per100g, item.quantity));
    }
  }

  return sumMacros(macrosList);
}

export default function FavoritesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={mockFavoriteDishes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 36 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <Text className="font-sans text-sm text-secondary">Registro preciso a un toque</Text>
            <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
              Platos favoritos
            </Text>

            <GlassPanel className="mt-6 px-4 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-[2px] text-secondary">
                    Combinaciones guardadas
                  </Text>
                  <Text className="mt-2 font-sans-bold text-[30px] text-primary">
                    {mockFavoriteDishes.length}
                  </Text>
                </View>
                <Text className="max-w-[170px] text-right font-sans text-sm leading-5 text-secondary">
                  Monta tus platos repetidos y registralos con macros consistentes en un toque.
                </Text>
              </View>
            </GlassPanel>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-3'}`}>
            <FavoriteDishCard dish={item} totals={getDishTotals(item.items)} />
          </ScreenTransition>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
