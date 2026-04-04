import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ScanLine } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { HttpRequestError } from '@/lib/api/http-client';
import type { CreateFoodInput } from '@/features/foods/domain/food.contracts';
import { useCreateFoodMutation } from '@/features/foods/queries/use-food-mutations';
import { FoodForm, type FoodFormValues } from '@/features/foods/ui/FoodForm';
import { useAppForm } from '@/features/foods/ui/form';

const FOOD_REFERENCE_AMOUNT = 100;

function pickParam(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }

  return param;
}

function parseMacroParam(param: string | string[] | undefined) {
  const value = pickParam(param);

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseServingParam(param: string | string[] | undefined) {
  const value = pickParam(param);

  if (!value) {
    return FOOD_REFERENCE_AMOUNT;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FOOD_REFERENCE_AMOUNT;
}

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string | string[];
    calories?: string | string[];
    protein?: string | string[];
    carbs?: string | string[];
    fats?: string | string[];
    serving?: string | string[];
    barcode?: string | string[];
    brand?: string | string[];
    from?: string | string[];
  }>();
  const createFoodMutation = useCreateFoodMutation();
  const prefilledName = pickParam(params.name) ?? '';
  const prefilledServing = parseServingParam(params.serving);
  const prefilledBarcode = pickParam(params.barcode);
  const prefilledBrand = pickParam(params.brand);
  const cameFromScan = pickParam(params.from) === 'scan-label';

  const defaultValues: FoodFormValues = {
    name: prefilledName,
    referenceAmount: FOOD_REFERENCE_AMOUNT,
    referenceMacros: {
      calories: parseMacroParam(params.calories),
      protein: parseMacroParam(params.protein),
      carbs: parseMacroParam(params.carbs),
      fats: parseMacroParam(params.fats),
    },
    defaultServingAmount: prefilledServing,
    supermarket: null,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const input: CreateFoodInput = {
        name: value.name,
        barcode: prefilledBarcode,
        brand: prefilledBrand,
        referenceAmount: value.referenceAmount,
        referenceMacros: value.referenceMacros,
        defaultServingAmount: value.defaultServingAmount,
        supermarket: value.supermarket,
      };

      try {
        const createdFood = await createFoodMutation.mutateAsync(input);
        router.replace({ pathname: '/food/[id]', params: { id: createdFood.id } });
      } catch (error) {
        if (error instanceof HttpRequestError && error.status === 409 && error.data && typeof error.data === 'object') {
          const conflictData = error.data as {
            message?: string;
            existingFoodId?: string;
            existingFoodName?: string;
          };

          const existingFoodId = conflictData.existingFoodId;
          const existingFoodName = conflictData.existingFoodName ?? 'alimento existente';

          if (existingFoodId) {
            Alert.alert(
              'Producto duplicado',
              `${existingFoodName} ya existe para este codigo de barras. ¿Quieres actualizarlo?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Ver actual',
                  onPress: () => router.push({ pathname: '/food/[id]', params: { id: existingFoodId } }),
                },
                {
                  text: 'Actualizar',
                  onPress: () => router.push({ pathname: '/food/edit/[id]', params: { id: existingFoodId } }),
                },
              ]
            );
            return;
          }
        }

        throw error;
      }
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

      {!cameFromScan ? (
        <View className="px-5 pt-4">
          <Button
            variant="outline"
            onPress={() => router.push('/food/scan')}
            accessibilityLabel="Anadir etiqueta escaneando codigo"
          >

            <ScanLine size={18} color="#60A5FA" strokeWidth={2} />
            <UIText>Anadir etiqueta</UIText>
          </Button>
        </View>
      ) : null}

      <FoodForm
        form={form as any}
        title="Nuevo alimento"
        subtitle="Crea una entrada precisa y reutilizable"
        ctaLabel="Guardar alimento"
        showPerServingPreview
        isSubmitting={createFoodMutation.isPending}
      />
    </SafeAreaView>
  );
}
