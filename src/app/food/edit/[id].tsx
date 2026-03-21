import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { UpdateFoodInput } from '@/features/foods/domain/food.contracts';
import { FoodFormSkeleton } from '@/components/QuerySkeletons';
import { FoodForm, type FoodFormValues } from '@/features/foods/ui/FoodForm';
import { useAppForm } from '@/features/foods/ui/form';
import { useUpdateFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { useFoodQuery } from '@/features/foods/queries/use-foods-query';

export default function EditFoodScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: food, isLoading } = useFoodQuery(id);
  const updateFoodMutation = useUpdateFoodMutation();

  if (!food) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        {isLoading ? (
          <FoodFormSkeleton />
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
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">EDITAR ALIMENTO</Text>
            </View>
            <View className="flex-1 items-center justify-center px-5">
              <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado el alimento</Text>
            </View>
          </>
        )}
      </SafeAreaView>
    );
  }

  const defaultValues: FoodFormValues = {
    name: food.name,
    referenceAmount: food.referenceAmount,
    referenceMacros: {
      calories: food.referenceMacros.calories,
      protein: food.referenceMacros.protein,
      carbs: food.referenceMacros.carbs,
      fats: food.referenceMacros.fats,
    },
    defaultServingAmount: food.defaultServingAmount ?? undefined,
    supermarket: food.supermarket ?? null,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const input: UpdateFoodInput = {
        name: value.name,
        referenceAmount: value.referenceAmount,
        referenceMacros: value.referenceMacros,
        defaultServingAmount: value.defaultServingAmount,
        supermarket: value.supermarket,
      };

      await updateFoodMutation.mutateAsync({
        id: food.id,
        input,
      });

      Alert.alert('Cambios guardados', `${value.name} se ha actualizado en tu backend.`, [
        {
          text: 'Ver detalle',
          onPress: () => router.replace({ pathname: '/food/[id]', params: { id: food.id } }),
        },
        { text: 'Vale', onPress: () => router.back() },
      ]);
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Volver atras"
        >
          <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">EDITAR ALIMENTO</Text>
      </View>

      <FoodForm
        form={form as any}
        title="Editar alimento"
        subtitle="Ajusta una entrada existente con la misma estructura que usaras contra backend"
        ctaLabel="Guardar cambios"
        showPerServingPreview
        isSubmitting={updateFoodMutation.isPending}
      />
    </SafeAreaView>
  );
}
