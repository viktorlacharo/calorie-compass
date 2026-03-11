import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { mockFoods } from '@/mocks/nutrition';

export default function FoodDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const food = mockFoods.find((f) => f.id === id);

  if (!food) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
            accessibilityRole="button"
            accessibilityLabel="Volver atras"
          >
            <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado el alimento</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentFood = food;
  const perServing = calculatePerServing(currentFood.per100g, currentFood.servingSize);

  const createdDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(currentFood.createdAt));

  function handleDelete() {
    Alert.alert(
      'Borrar alimento',
      `Seguro que quieres borrar "${currentFood.name}"? Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar alimento',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
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
            <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
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
        <ScreenTransition variant="right" className="px-5 pt-5">
          <Text className="font-sans-bold text-lg text-primary">{currentFood.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Badge variant="secondary">
              <UIText className="text-[9px]">
                {currentFood.servingSize}
                {currentFood.servingUnit}
              </UIText>
            </Badge>
            <Text className="font-sans text-[10px] text-muted">Anadido el {createdDate}</Text>
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={40} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            POR 100{currentFood.servingUnit.toUpperCase()}
          </Text>
          <NutritionGrid macros={currentFood.per100g} size="md" className="mt-3" />
          <MacroBar macros={currentFood.per100g} className="mt-3" />
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={80} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            POR RACION ({currentFood.servingSize}
            {currentFood.servingUnit.toUpperCase()})
          </Text>
          <NutritionGrid macros={perServing} size="md" className="mt-3" />
          <MacroBar macros={perServing} className="mt-3" />
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={120} className="px-5">
          <GlassPanel className="px-4 py-4">
            <Text className="font-sans text-[11px] uppercase tracking-[1.5px] text-secondary">Resumen rapido</Text>
            <View className="mt-4 flex-row gap-2">
              <View className="rounded-full bg-protein/10 px-3 py-2">
                <Text className="font-sans text-[11px] text-protein">P {perServing.protein}g</Text>
              </View>
              <View className="rounded-full bg-carbs/10 px-3 py-2">
                <Text className="font-sans text-[11px] text-carbs">C {perServing.carbs}g</Text>
              </View>
              <View className="rounded-full bg-fat/10 px-3 py-2">
                <Text className="font-sans text-[11px] text-fat">G {perServing.fats}g</Text>
              </View>
            </View>
          </GlassPanel>
        </ScreenTransition>
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button variant="outline" accessibilityLabel="Editar alimento" onPress={() => {}}>
          <UIText>Editar alimento</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
