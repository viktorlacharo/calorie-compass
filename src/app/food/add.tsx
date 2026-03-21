import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { CreateFoodInput } from '@/features/foods/domain/food.contracts';
import { useCreateFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { FoodForm, type FoodFormValues } from '@/features/foods/ui/FoodForm';
import { useAppForm } from '@/features/foods/ui/form';

const FOOD_REFERENCE_AMOUNT = 100;

export default function AddFoodScreen() {
  const router = useRouter();
  const createFoodMutation = useCreateFoodMutation();

  const defaultValues: FoodFormValues = {
    name: '',
    referenceAmount: FOOD_REFERENCE_AMOUNT,
    referenceMacros: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    },
    defaultServingAmount: FOOD_REFERENCE_AMOUNT,
    supermarket: null,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const input: CreateFoodInput = {
        name: value.name,
        referenceAmount: value.referenceAmount,
        referenceMacros: value.referenceMacros,
        defaultServingAmount: value.defaultServingAmount,
        supermarket: value.supermarket,
      };

      const createdFood = await createFoodMutation.mutateAsync(input);

      Alert.alert('Alimento creado', `${value.name} se ha guardado en tu backend.`, [
        {
          text: 'Ver detalle',
          onPress: () => router.replace({ pathname: '/food/[id]', params: { id: createdFood.id } }),
        },
        { text: 'Volver', onPress: () => router.back() },
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
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">ANADIR ALIMENTO</Text>
      </View>

      <FoodForm
        form={form as any}
        title="Nuevo alimento"
        subtitle="Crea una entrada precisa y reutilizable"
        ctaLabel="Guardar alimento"
        showPerServingPreview
      />
    </SafeAreaView>
  );
}
