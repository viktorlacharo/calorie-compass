import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FoodFormSkeleton } from '@/components/QuerySkeletons';
import { FoodForm } from '@/features/foods/ui/FoodForm';
import { useUpdateFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { useFoodQuery } from '@/features/foods/queries/use-foods-query';
import { calculatePerServing } from '@/utils/calculatePerServing';
import type { MacroNutrients, Supermarket } from '@/types/nutrition';

export default function EditFoodScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: food, isLoading } = useFoodQuery(id);
  const updateFoodMutation = useUpdateFoodMutation();

  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('100');
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
    setServingSize(String(food.servingSize));
    setCalories(String(food.per100g.calories));
    setProtein(String(food.per100g.protein));
    setCarbs(String(food.per100g.carbs));
    setFats(String(food.per100g.fats));
    setSupermarket(food.supermarket ?? null);
  }, [food]);

  const per100g: MacroNutrients = useMemo(
    () => ({
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
    }),
    [calories, protein, carbs, fats]
  );

  const preview = useMemo(() => calculatePerServing(per100g, Number(servingSize) || 0), [per100g, servingSize]);
  const canSave = Boolean(food) && name.trim().length > 0 && Number(calories) > 0 && Number(servingSize) > 0;

  async function handleSave() {
    if (!food) {
      return;
    }

    await updateFoodMutation.mutateAsync({
      id: food.id,
      input: {
        name,
        servingSize: Number(servingSize) || 100,
        servingUnit: 'g',
        supermarket,
        per100g,
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
        values={{ name, servingSize, calories, protein, carbs, fats, supermarket }}
        per100g={per100g}
        preview={preview}
        canSave={canSave}
        onChange={(field, value) => {
          if (field === 'name') setName(String(value));
          if (field === 'servingSize') setServingSize(String(value));
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
