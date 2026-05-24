import { View, Text, ScrollView, Pressable, Alert, Image, Platform } from 'react-native';
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

  function handleBackToFoods() {
    router.replace('/(tabs)/foods');
  }

  if (!food) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        {isLoading ? (
          <FoodDetailSkeleton />
        ) : (
          <>
            <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
              <Pressable
                onPress={handleBackToFoods}
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

  function handleDelete() {
    console.log('[handleDelete] Clicked trash icon for food:', currentFood.id, currentFood.name);

    const performDelete = async () => {
      try {
        console.log('[handleDelete] Initiating delete mutation...');
        const result = await deleteFoodMutation.mutateAsync(currentFood.id);
        console.log('[handleDelete] Mutation result:', result);

        if (result.status === 'blocked') {
          const recipeNames = result.recipes?.map((r) => r.name).join('\n- ') || '';
          const msg = `Este alimento está en uso en las siguientes recetas:\n\n- ${recipeNames || `${result.recipeCount} recetas`}`;
          
          if (Platform.OS === 'web') {
            alert(`No se puede borrar: ${msg}`);
          } else {
            Alert.alert('No se puede borrar', msg);
          }
          console.warn('[handleDelete] Delete blocked:', msg);
          return;
        }

        const msgSuccess = `"${currentFood.name}" se ha eliminado correctamente.`;
        if (Platform.OS === 'web') {
          alert(msgSuccess);
          router.replace('/(tabs)/foods');
        } else {
          Alert.alert('Alimento eliminado', msgSuccess, [
            { text: 'Vale', onPress: () => router.replace('/(tabs)/foods') },
          ]);
        }
      } catch (error) {
        console.error('[handleDelete] Error during deletion:', error);
        if (Platform.OS === 'web') {
          alert('Error: No se ha podido eliminar el alimento.');
        } else {
          Alert.alert('Error', 'No se ha podido eliminar el alimento.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`¿Seguro que quieres eliminar "${currentFood.name}"? Esta acción no se puede deshacer.`);
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        '¿Eliminar alimento?',
        `¿Seguro que quieres eliminar "${currentFood.name}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
          <View className="flex-row items-center">
            <Pressable
              onPress={handleBackToFoods}
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
            {currentFood.brand ? (
              <Badge variant="outline">
                <UIText className="text-[9px]">{currentFood.brand}</UIText>
              </Badge>
            ) : null}
            {supermarket ? (
              <View className="flex-row items-center gap-2 rounded-full border border-border bg-forest-panelAlt px-3 py-1.5">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-white/90">
                  <Image source={supermarket.logo} className="h-3.5 w-3.5" style={{ width: 14, height: 14 }} resizeMode="contain" />
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
          {currentFood.barcode ? (
            <View className="mt-3 rounded-[24px] border border-border bg-surface/80 px-4 py-4">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Codigo de barras</Text>
              <Text className="mt-2 font-mono text-sm text-primary">{currentFood.barcode}</Text>
            </View>
          ) : null}
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
