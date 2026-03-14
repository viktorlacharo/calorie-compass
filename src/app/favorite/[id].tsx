import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Clock3, Send, Share2, Sparkles, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/GlassPanel';
import { MacroMicroTable } from '@/components/MacroMicroTable';
import { FavoriteDetailSkeleton } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import { useFavoriteQuery } from '@/features/favorites/queries/use-favorites-query';
import { useCreateMealLogEntryMutation } from '@/features/logs/queries/use-logs-query';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import type { MacroNutrients } from '@/types/nutrition';

function formatMacro(value: number) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatQuantity(value: number, unit: string) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

export default function FavoriteDishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const createMealLogEntryMutation = useCreateMealLogEntryMutation();
  const { data: foods = [], isLoading: foodsLoading } = useFoodsQuery('');
  const { data: dish, isLoading: dishLoading } = useFavoriteQuery(id);
  const isLoading = dishLoading || (foodsLoading && foods.length === 0);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <FavoriteDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!dish) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
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
            <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado la receta</Text>
          </View>
        </>
      </SafeAreaView>
    );
  }

  const currentDish = dish;

  const resolvedItems = currentDish.items.map((item) => {
    const food = foods.find((f) => f.id === item.foodId);
    const macros = food
      ? calculatePerServing(food.per100g, item.quantity)
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };

    return { ...item, food, macros };
  });

  const totalMacros: MacroNutrients = sumMacros(resolvedItems.map((i) => i.macros));

  function handleShare() {
    Alert.alert('Compartir receta', 'La opcion de compartir llegara en una proxima iteracion.');
  }

  async function handleLogDish() {
    await createMealLogEntryMutation.mutateAsync({
      source: 'favorite',
      total: totalMacros,
      favoriteDishId: currentDish.id,
      notes: currentDish.name,
    });

    Alert.alert('Receta registrada', `"${currentDish.name}" se ha registrado correctamente.`, [
      { text: 'Vale', onPress: () => router.replace('/(tabs)') },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition>
          <View className="relative bg-canvas">
            <Image source={{ uri: currentDish.imageUri }} className="h-[500px] w-full" resizeMode="cover" />

            <LinearGradient
              colors={['rgba(7,17,10,0)', 'rgba(7,17,10,0.08)', 'rgba(7,17,10,0.42)', '#07110A']}
              locations={[0, 0.45, 0.74, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              pointerEvents="none"
              className="absolute inset-x-0 bottom-0 h-56"
            />

            <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-4 pb-6 pt-4">
              <Pressable
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35"
                accessibilityRole="button"
                accessibilityLabel="Volver atras"
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
              </Pressable>

              <Pressable
                onPress={handleShare}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35"
                accessibilityRole="button"
                accessibilityLabel="Compartir receta"
              >
                <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>

            <View className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-36">
              <View className="flex-row flex-wrap items-center gap-2">
                {currentDish.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-white/30 bg-black/45 px-3 py-1.5">
                    <UIText className="text-white/85">{tag}</UIText>
                  </Badge>
                ))}
              </View>

              <Text className="mt-4 font-sans-bold text-[30px] leading-[34px] text-white">{currentDish.name}</Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-white/80">{currentDish.description}</Text>

              <View className="mt-4 flex-row flex-wrap items-center gap-4">
                <View className="flex-row items-center gap-1.5">
                  <Clock3 size={14} color="#E7E5E4" strokeWidth={1.8} />
                  <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-white/85">
                    {currentDish.prepMinutes} min
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={14} color="#E7E5E4" strokeWidth={1.8} />
                  <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-white/85">
                    {currentDish.difficulty}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Users size={14} color="#E7E5E4" strokeWidth={1.8} />
                  <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-white/85">
                    {currentDish.servings} racion
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScreenTransition>

        <ScreenTransition delay={40} className="px-5 pt-1">
          <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Resumen nutricional</Text>

          <View className="mt-5 border-b border-border pb-5">
            <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorias</Text>
            <Text className="mt-2 font-sans-bold text-[42px] text-primary">{Math.round(totalMacros.calories)}</Text>
            <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-brand">kcal por receta</Text>
          </View>

          <View className="mt-5 flex-row flex-wrap gap-2">
            <View className="rounded-full bg-forest-panelAlt px-3 py-2">
              <Text className="font-sans text-[11px] uppercase tracking-[1.1px] text-secondary">
                {currentDish.prepMinutes} min
              </Text>
            </View>
            <View className="rounded-full bg-forest-panelAlt px-3 py-2">
              <Text className="font-sans text-[11px] uppercase tracking-[1.1px] text-secondary">
                {resolvedItems.length} ingredientes
              </Text>
            </View>
            <View className="rounded-full bg-forest-panelAlt px-3 py-2">
              <Text className="font-sans text-[11px] uppercase tracking-[1.1px] text-secondary">
                {currentDish.difficulty}
              </Text>
            </View>
          </View>

          <NutritionGrid macros={totalMacros} size="sm" className="mt-5" />
          <MacroBar macros={totalMacros} className="mt-5" />

          <View className="mt-5 rounded-[28px] border border-border bg-forest-panelAlt/60 px-4 py-4">
            <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Lectura rapida</Text>
            <Text className="mt-3 font-sans text-sm leading-6 text-secondary">
              Receta pensada para repetir con medidas estables, ingredientes identificables y un reparto de macros facil de revisar de un vistazo.
            </Text>
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        <ScreenTransition delay={80} className="px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Ingredientes</Text>
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-muted">{currentDish.servings} racion</Text>
          </View>

          <View className="mt-5">
            {resolvedItems.map((item, index) => (
              <View
                key={`${item.foodId}-${index}`}
                className={index === 0 ? 'pb-5' : 'border-t border-border py-5'}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-2">
                        <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                        <Text className="font-sans-medium text-sm text-primary">
                          {item.food?.name ?? 'Alimento desconocido'}
                        </Text>
                      </View>

                      <Text className="font-sans-bold text-base text-primary">{Math.round(item.macros.calories)} kcal</Text>
                    </View>
                    <View className="flex-row w-full flex-nowrap items-center justify-between">
                    <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-secondary">
                      {formatQuantity(item.quantity, item.unit)}
                    </Text>

                      <MacroMicroTable macros={item.macros} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        <ScreenTransition delay={120} className="px-5">
          <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Elaboracion</Text>

          <View className="mt-5">
            {currentDish.steps.map((step, index) => (
              <View
                key={step}
                className={index === 0 ? 'flex-row gap-4 pb-5' : 'flex-row gap-4 border-t border-border py-5'}
              >
                <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full border border-brand/20 bg-brand/15">
                  <Text className="font-mono text-xs text-brand">{index + 1}</Text>
                </View>
                <Text className="flex-1 font-sans text-sm leading-6 text-secondary">{step}</Text>
              </View>
            ))}
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        <ScreenTransition delay={160} className="px-5">
          <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Acciones futuras</Text>

          <View className="mt-3 gap-3">
            <GlassPanel className="px-4 py-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                  <Send size={18} color="#EC5B13" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-medium text-sm text-primary">Compartir receta</Text>
                  <Text className="mt-1 font-sans text-sm leading-5 text-secondary">
                    Dejamos visible el acceso para la proxima iteracion social del recetario.
                  </Text>
                </View>
              </View>
            </GlassPanel>

            <GlassPanel className="px-4 py-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-carbs/10">
                  <Camera size={18} color="#60A5FA" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-medium text-sm text-primary">Extraccion automatica</Text>
                  <Text className="mt-1 font-sans text-sm leading-5 text-secondary">
                    Esta receta ya queda preparada para futuros flujos con foto o video procesados por LLM.
                  </Text>
                </View>
              </View>
            </GlassPanel>
          </View>
        </ScreenTransition>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-surface/95 px-5 py-8">
        <View className="flex-row gap-3">
          <Button
            variant="outline"
            size="icon"
            onPress={handleShare}
            accessibilityLabel="Compartir receta"
            className="h-12 w-12 rounded-2xl"
          >
            <Share2 size={18} color="#F5F7F2" strokeWidth={1.9} />
          </Button>

          <Button onPress={() => void handleLogDish()} accessibilityLabel="Registrar esta receta" className="h-12 flex-1 rounded-2xl">
            <UIText>Registrar esta receta</UIText>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
