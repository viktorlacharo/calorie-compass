import { View, Text, ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, PencilLine, Trash2 } from 'lucide-react-native';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FoodDetailSkeleton } from '@/components/QuerySkeletons';
import { Text as UIText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { ScreenTransition } from '@/components/ScreenTransition';
import { getSupermarketMeta } from '@/constants/supermarkets';
import { mockFavoriteDishes } from '@/mocks/nutrition';
import { useDeleteFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { useFoodQuery } from '@/features/foods/queries/use-foods-query';
import {
  calculateFoodDefaultServingMacros,
  formatGramAmount,
} from '@/utils/foodMeasurements';

export default function FoodDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deleteFoodMutation = useDeleteFoodMutation();
  const { data: food, isLoading } = useFoodQuery(id);

  if (!food) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        {isLoading ? (
          <FoodDetailSkeleton />
        ) : (
          <>
            <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
              <Pressable
                onPress={() => router.back()}
                className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
                accessibilityRole="button"
                accessibilityLabel="Volver atras"
              >
                <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
              </Pressable>
            </View>
            <View className="flex-1 items-center justify-center px-5">
              <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado el alimento</Text>
            </View>
          </>
        )}
      </SafeAreaView>
    );
  }

  const currentFood = food;
  const supermarket = getSupermarketMeta(currentFood.supermarket);
  const defaultServingLabel = currentFood.defaultServingAmount
    ? formatGramAmount(currentFood.defaultServingAmount)
    : 'Sin racion por defecto';
  const referenceLabel = formatGramAmount(currentFood.referenceAmount);
  const defaultServingMacros = calculateFoodDefaultServingMacros(currentFood);

  const createdDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(currentFood.createdAt));

  async function handleDelete() {
    const usages = mockFavoriteDishes.filter((dish) => dish.items.some((item) => item.foodId === currentFood.id)).length;

    if (usages > 0) {
      Alert.alert('No se puede borrar', `"${currentFood.name}" se usa en ${usages} ${usages === 1 ? 'receta' : 'recetas'}. Quita primero esas referencias.`);
      return;
    }

    const result = await deleteFoodMutation.mutateAsync(currentFood.id);

    if (result.status === 'blocked') {
      Alert.alert('No se puede borrar', `Este alimento sigue usado en ${result.recipeCount} recetas.`);
      return;
    }

    Alert.alert('Borrado preparado', `"${currentFood.name}" quedaria eliminado cuando conectemos el backend mock.`, [
      { text: 'Vale', onPress: () => router.replace('/(tabs)/foods') },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
            accessibilityRole="button"
            accessibilityLabel="Volver atras"
          >
            <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
          </Pressable>
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            DETALLE DEL ALIMENTO
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          className="h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Borrar alimento"
        >
          <Trash2 size={16} color="#DC2626" strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition className="px-5 pt-5">
          <Text className="font-sans-bold text-lg text-primary">{currentFood.name}</Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <UIText className="text-[9px]">
                {defaultServingLabel}
              </UIText>
            </Badge>
            {supermarket ? (
              <View className="flex-row items-center gap-2 rounded-full border border-border bg-forest-panelAlt px-3 py-1.5">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-white/90">
                  <Image source={supermarket.logo} className="h-3.5 w-3.5" resizeMode="contain" />
                </View>
                <Text className="font-sans text-[10px] uppercase tracking-[1.1px] text-secondary">
                  {supermarket.label}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-1.5 flex-row items-center gap-2">
            <Text className="font-sans text-[10px] text-muted">Anadido el {createdDate}</Text>
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition delay={40} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            REFERENCIA NUTRICIONAL
          </Text>
          <Text className="mt-2 font-sans text-sm text-secondary">Valores para {referenceLabel}</Text>
          <NutritionGrid macros={currentFood.referenceMacros} size="md" className="mt-3" />
          <MacroBar macros={currentFood.referenceMacros} className="mt-8" />
        </ScreenTransition>

        <ScreenTransition delay={70} className="mt-8 px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">RACION POR DEFECTO</Text>
          <Text className="mt-2 font-sans text-sm text-secondary">
            {currentFood.defaultServingAmount
              ? `Preview para ${defaultServingLabel}`
              : `Sin racion guardada. El backend puede usar ${currentFood.referenceAmount} g como fallback.`}
          </Text>
          <NutritionGrid macros={defaultServingMacros} size="sm" className="mt-3" />
        </ScreenTransition>
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button variant="outline" accessibilityLabel="Editar alimento" onPress={() => router.push({ pathname: '/food/edit/[id]', params: { id: currentFood.id } })}>
          <PencilLine size={16} color="#F5F7F2" strokeWidth={2} />
          <UIText>Editar alimento</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
