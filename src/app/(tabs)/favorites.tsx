import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { FavoriteDishCard } from '@/components/FavoriteDishCard';
import { FavoriteDishCardSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import { useFavoritesQuery } from '@/features/favorites/queries/use-favorites-query';
import { useDeleteFavoriteMutation } from '@/features/favorites/queries/use-favorite-mutations';
import { useCreateMealLogEntryMutation } from '@/features/logs/queries/use-logs-query';
import { calculateFoodServingMacros } from '@/utils/foodMeasurements';
import { sumMacros } from '@/utils/sumMacros';
import type { FavoriteDish, FavoriteDishItem, Food, MacroNutrients } from '@/types/nutrition';

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

function FavoriteDishRow({
  item,
  index,
  foods,
  onDelete,
  onRegister,
  isOpen,
  onOpen,
  onClose,
  onPress,
}: {
  item: FavoriteDish;
  index: number;
  foods: Food[];
  onDelete: (id: string) => void;
  onRegister: (dish: FavoriteDish, totals: MacroNutrients) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPress: () => void;
}) {
  const totals = getDishTotals(item.items, foods);

  return (
    <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-4'}`}>
      <SwipeableRow
        onDelete={() => onDelete(item.id)}
        onRegister={() => onRegister(item, totals)}
        onPress={onPress}
        onOpen={onOpen}
        onClose={onClose}
        isOpen={isOpen}
        disabled={false}
      >
        <FavoriteDishCard dish={item} totals={totals} />
      </SwipeableRow>
    </ScreenTransition>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: favoriteDishes = [], isLoading: favoritesLoading } = useFavoritesQuery();
  const { data: foods = [], isLoading: foodsLoading } = useFoodsQuery('');
  const deleteFavoriteMutation = useDeleteFavoriteMutation();
  const createMealLogEntryMutation = useCreateMealLogEntryMutation();
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const isInitialLoading = (favoritesLoading && favoriteDishes.length === 0) || (foodsLoading && foods.length === 0);
  const shouldShowLoadingList = favoritesLoading || (foodsLoading && foods.length === 0);
  const listData = shouldShowLoadingList ? [] : favoriteDishes;

  function handleDelete(id: string) {
    setOpenRowId((current) => (current === id ? null : current));
    deleteFavoriteMutation.mutate(id);
  }

  function handleRegister(dish: FavoriteDish, totals: MacroNutrients) {
    Alert.alert(
      'Registrar',
      `¿Añadir "${dish.name}" (${Math.round(totals.calories)} kcal) al registro de hoy?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: () => {
            createMealLogEntryMutation.mutate({
              source: 'favorite',
              total: totals,
              favoriteDishId: dish.id,
              notes: dish.name,
            });
          },
        },
      ],
    );
  }

  function handleOpenDish(id: string) {
    setOpenRowId(null);
    router.push({ pathname: '/favorite/[id]', params: { id } });
  }

  useFocusEffect(
    useCallback(() => {
      setOpenRowId(null);
      return undefined;
    }, [])
  );

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
                  accessibilityLabel="Añadir receta"
                >
                  <Plus size={20} color="#F5F7F2" strokeWidth={2.2} />
                </Pressable>
              </Link>
            </View>

            <View className="mt-6">
              <Text className="font-sans text-sm leading-6 text-secondary">
                Entra en cada receta para ver imagen, ingredientes, elaboración y su desglose nutricional completo. Desliza a la derecha para registrar, a la izquierda para eliminar.
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
          <FavoriteDishRow
            item={item}
            index={index}
            foods={foods}
            onDelete={handleDelete}
            onRegister={handleRegister}
            isOpen={openRowId === item.id}
            onOpen={() => setOpenRowId(item.id)}
            onClose={() => setOpenRowId((current) => (current === item.id ? null : current))}
            onPress={() => handleOpenDish(item.id)}
          />
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
                <Text className="font-sans-medium text-base text-primary">Todavía no hay recetas guardadas</Text>
                <Text className="mt-2 font-sans text-sm text-secondary">
                  Crea tu primer plato favorito y añade tags personalizados para clasificarlo.
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
