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
import { sumMacros } from '@/utils/sumMacros';
import { mockFavoriteDishes, mockFoods } from '@/mocks/nutrition';
import type { MacroNutrients } from '@/types/nutrition';

export default function FavoriteDishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const dish = mockFavoriteDishes.find((d) => d.id === id);

  if (!dish) {
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
          <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado el plato</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDish = dish;

  const resolvedItems = currentDish.items.map((item) => {
    const food = mockFoods.find((f) => f.id === item.foodId);
    const macros = food
      ? calculatePerServing(food.per100g, item.quantity)
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return { ...item, food, macros };
  });

  const totalMacros: MacroNutrients = sumMacros(resolvedItems.map((i) => i.macros));

  const createdDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(currentDish.createdAt));

  function handleDelete() {
    Alert.alert(
      'Borrar plato',
      `Seguro que quieres borrar "${currentDish.name}"? Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar plato',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  }

  function handleLogDish() {
    Alert.alert('Comida registrada', `"${currentDish.name}" se ha registrado correctamente.`, [
      { text: 'Vale', onPress: () => router.back() },
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
            <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
          </Pressable>
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            DETALLE DEL PLATO
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          className="h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Borrar plato"
        >
          <Trash2 size={16} color="#DC2626" strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition variant="right" className="px-5 pt-5">
          <Text className="font-sans-bold text-lg text-primary">{currentDish.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Badge variant="secondary">
              <UIText className="text-[9px]">
                {currentDish.items.length} {currentDish.items.length === 1 ? 'INGREDIENTE' : 'INGREDIENTES'}
              </UIText>
            </Badge>
            <Text className="font-sans text-[10px] text-muted">Creado el {createdDate}</Text>
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={40} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            TOTAL NUTRICIONAL
          </Text>
          <NutritionGrid macros={totalMacros} size="md" className="mt-3" />
          <MacroBar macros={totalMacros} className="mt-3" />
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={80} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            INGREDIENTES
          </Text>

          {resolvedItems.map((item, index) => (
            <GlassPanel key={index} className="mt-3 px-4 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
                    {item.food?.name ?? 'Alimento desconocido'}
                  </Text>
                  <Text className="mt-1 font-sans text-[11px] uppercase tracking-[1.3px] text-secondary">
                    {item.quantity}
                    {item.unit}
                  </Text>
                </View>
                <Text className="font-sans-bold text-lg text-primary">{item.macros.calories}</Text>
              </View>

              <View className="mt-4 flex-row gap-2">
                <View className="rounded-full bg-protein/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-protein">P {item.macros.protein}g</Text>
                </View>
                <View className="rounded-full bg-carbs/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-carbs">C {item.macros.carbs}g</Text>
                </View>
                <View className="rounded-full bg-fat/10 px-3 py-2">
                  <Text className="font-sans text-[11px] text-fat">G {item.macros.fats}g</Text>
                </View>
              </View>
            </GlassPanel>
          ))}
        </ScreenTransition>
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button onPress={handleLogDish} accessibilityLabel="Registrar este plato">
          <UIText>Registrar este plato</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
