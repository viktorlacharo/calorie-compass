import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Plus } from 'lucide-react-native';
import { FavoriteDishCard } from '@/components/FavoriteDishCard';
import { FavoriteDishCardSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import { useFavoritesQuery } from '@/features/favorites/queries/use-favorites-query';
import { calculateFoodServingMacros } from '@/utils/foodMeasurements';
import { sumMacros } from '@/utils/sumMacros';
import type { FavoriteDishItem, Food, MacroNutrients } from '@/types/nutrition';

function getDishTotals(dishItems: FavoriteDishItem[], foods: Food[]) {
  const macrosList: MacroNutrients[] = [];

  for (const item of dishItems) {
    const food = foods.find((entry) => entry.id === item.foodId);
    if (food) {
      macrosList.push(calculateFoodServingMacros(food, item.quantity));
    }
  }

  return sumMacros(macrosList);
}

export default function FavoritesScreen() {
  const { data: favoriteDishes = [], isLoading: favoritesLoading } = useFavoritesQuery();
  const { data: foods = [], isLoading: foodsLoading } = useFoodsQuery('');
  const isInitialLoading = (favoritesLoading && favoriteDishes.length === 0) || (foodsLoading && foods.length === 0);
  const shouldShowLoadingList = favoritesLoading || (foodsLoading && foods.length === 0);
  const listData = shouldShowLoadingList ? [] : favoriteDishes;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <Text className="font-sans text-sm text-secondary">Tu recetario privado y reutilizable</Text>
            <View className="mt-1 flex-row items-center justify-between gap-3">
              <Text className="font-sans-bold text-[31px] leading-[34px] text-primary">Recetario</Text>
              <Link href="/favorite/create" asChild>
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-full border border-border bg-forest-panelAlt active:opacity-85"
                  accessibilityRole="button"
                  accessibilityLabel="Anadir receta"
                >
                  <Plus size={20} color="#F5F7F2" strokeWidth={2.2} />
                </Pressable>
              </Link>
            </View>

            <View className="mt-6">
              <Text className="font-sans text-sm leading-6 text-secondary">
                Entra en cada receta para ver imagen, ingredientes, elaboracion y su desglose nutricional completo como una libreria reutilizable.
              </Text>

              <View className="mt-5 flex-row items-end justify-between border-b border-border pb-4">
                <View>
                  <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Recetas guardadas</Text>
                  {isInitialLoading ? (
                    <SkeletonBlock className="mt-3 h-10 w-12 rounded-full" />
                  ) : (
                    <Text className="mt-2 font-sans-bold text-[36px] text-primary">{favoriteDishes.length}</Text>
                  )}
                </View>

                
              </View>
            </View>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-4'}`}>
            <Link href={{ pathname: '/favorite/[id]', params: { id: item.id } }} asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={`Abrir receta ${item.name}`}>
                <FavoriteDishCard dish={item} totals={getDishTotals(item.items, foods)} />
              </Pressable>
            </Link>
          </ScreenTransition>
        )}
        ListEmptyComponent={
          isInitialLoading ? (
            <View className="px-5 pt-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <ScreenTransition key={index} delay={40 + index * 20} className={index === 0 ? '' : 'mt-4'}>
                  <FavoriteDishCardSkeleton />
                </ScreenTransition>
              ))}
            </View>
          ) : (
            <View className="px-5">
              <View className="border-t border-border py-6">
                <Text className="font-sans-medium text-base text-primary">Todavia no hay recetas guardadas</Text>
                <Text className="mt-2 font-sans text-sm text-secondary">
                  Crea tu primer plato favorito y anade tags personalizados para clasificarlo.
                </Text>
              </View>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
