import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FoodFormSkeleton } from '@/components/QuerySkeletons';
import { FoodForm } from '@/features/foods/ui/FoodForm';
import { useUpdateFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { useFoodQuery } from '@/features/foods/queries/use-foods-query';
import { calculateServingMacros } from '@/utils/calculatePerServing';
import type { MacroNutrients, Supermarket } from '@/types/nutrition';

const FOOD_REFERENCE_AMOUNT = 100;

export default function EditFoodScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: food, isLoading } = useFoodQuery(id);
  const updateFoodMutation = useUpdateFoodMutation();

  const [name, setName] = useState('');
  const [defaultServingAmount, setDefaultServingAmount] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);

  useEffect(() => {
    if (!food) {
      return;
    }

    setName(food.name);
    setDefaultServingAmount(food.defaultServingAmount ? String(food.defaultServingAmount) : '');
    setCalories(String(food.referenceMacros.calories));
    setProtein(String(food.referenceMacros.protein));
    setCarbs(String(food.referenceMacros.carbs));
    setFats(String(food.referenceMacros.fats));
    setSupermarket(food.supermarket ?? null);
  }, [food]);

  const referenceMacros: MacroNutrients = useMemo(
    () => ({
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
    }),
    [calories, protein, carbs, fats]
  );

  const resolvedDefaultServingAmount = Number(defaultServingAmount) || FOOD_REFERENCE_AMOUNT;

  const preview = useMemo(
    () => calculateServingMacros(referenceMacros, FOOD_REFERENCE_AMOUNT, resolvedDefaultServingAmount),
    [referenceMacros, resolvedDefaultServingAmount]
  );
  const canSave = Boolean(food) && name.trim().length > 0 && Number(calories) > 0;

  async function handleSave() {
    if (!food) {
      return;
    }

    await updateFoodMutation.mutateAsync({
      id: food.id,
      input: {
        name,
        referenceAmount: FOOD_REFERENCE_AMOUNT,
        referenceMacros,
        defaultServingAmount: defaultServingAmount.trim().length > 0 ? resolvedDefaultServingAmount : undefined,
        supermarket,
      },
    });

    Alert.alert('Cambios preparados', `${name} ya esta listo para persistirse en el backend mock.`, [
      {
        text: 'Ver detalle',
        onPress: () => router.replace({ pathname: '/food/[id]', params: { id: food.id } }),
      },
      { text: 'Vale', onPress: () => router.back() },
    ]);
  }

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
        title="Editar alimento"
        subtitle="Ajusta una entrada existente con la misma estructura que usaras contra backend"
        ctaLabel="Guardar cambios"
        values={{ name, defaultServingAmount, calories, protein, carbs, fats, supermarket }}
        referenceAmount={FOOD_REFERENCE_AMOUNT}
        preview={preview}
        previewTitle={`Vista previa - racion de ${resolvedDefaultServingAmount}g`}
        canSave={canSave}
        onChange={(field, value) => {
          if (field === 'name') setName(String(value));
          if (field === 'defaultServingAmount') setDefaultServingAmount(String(value));
          if (field === 'calories') setCalories(String(value));
          if (field === 'protein') setProtein(String(value));
          if (field === 'carbs') setCarbs(String(value));
          if (field === 'fats') setFats(String(value));
          if (field === 'supermarket') setSupermarket(value as Supermarket | null);
        }}
        onSubmit={() => void handleSave()}
      />
    </SafeAreaView>
  );
}
