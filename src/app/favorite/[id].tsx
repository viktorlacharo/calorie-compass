import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Clock3, Send, Share2, Sparkles, Trash2, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
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
import { useDeleteFavoriteMutation } from '@/features/favorites/queries/use-favorite-mutations';
import { calculateFoodServingMacros } from '@/utils/foodMeasurements';
import { sumMacros } from '@/utils/sumMacros';
import type { MacroNutrients } from '@/types/nutrition';

function formatMacro(value: number) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

function formatQuantity(value: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)} g`;
}

function splitPreparationIntoSteps(steps: string[]) {
  return steps
    .flatMap((step) => step.split(/\n{2,}/))
    .map((step) => step.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation modal (no Alert.alert)
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  dishName,
  visible,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  dishName: string;
  visible: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutUp.duration(140)}
      className="absolute inset-0 z-50 items-center justify-end bg-black/60"
      pointerEvents="auto"
    >
      <Pressable className="absolute inset-0" onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar" />
      <View className="w-full rounded-t-[28px] border-t border-border bg-surface px-5 pb-10 pt-6">
        <View className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <View className="mb-5 h-14 w-14 items-center justify-center rounded-full bg-red-400/10">
          <Trash2 size={24} color="#f87171" strokeWidth={2} />
        </View>

        <Text className="font-sans-bold text-xl text-primary">¿Eliminar receta?</Text>
        <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
          Se eliminará "{dishName}" de tu recetario. Esta acción no se puede deshacer.
        </Text>

        <View className="mt-6 gap-3">
          <Button
            onPress={onConfirm}
            disabled={isDeleting}
            className="h-12 bg-red-500 active:bg-red-600"
            accessibilityLabel="Confirmar eliminación"
          >
            {isDeleting ? (
              <UIText>Eliminando…</UIText>
            ) : (
              <>
                <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                <UIText>Sí, eliminar</UIText>
              </>
            )}
          </Button>
          <Button variant="outline" onPress={onCancel} disabled={isDeleting} className="h-12" accessibilityLabel="Cancelar">
            <UIText>Cancelar</UIText>
          </Button>
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Recién creada" success banner
// ─────────────────────────────────────────────────────────────────────────────

function JustCreatedBanner({ dishName }: { dishName: string }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(200)}
      exiting={FadeOutUp.duration(200)}
      className="mx-5 mt-4 flex-row items-center gap-3 rounded-[18px] border border-protein/30 bg-protein/8 px-4 py-3.5"
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-protein/15">
        <Check size={15} color="#4ade80" strokeWidth={2.5} />
      </View>
      <View className="flex-1">
        <Text className="font-sans-medium text-sm text-primary">Receta guardada</Text>
        <Text className="font-sans text-xs text-secondary" numberOfLines={1}>
          "{dishName}" está ahora en tu recetario.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function FavoriteDishDetailScreen() {
  const router = useRouter();
  const { id, justCreated } = useLocalSearchParams<{ id: string; justCreated?: string }>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const createMealLogEntryMutation = useCreateMealLogEntryMutation();
  const deleteFavoriteMutation = useDeleteFavoriteMutation();
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
        <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
          >
            <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="font-sans-medium text-sm text-secondary">No se ha encontrado la receta</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDish = dish;
  const preparationSteps = splitPreparationIntoSteps(currentDish.steps);

  const resolvedItems = currentDish.items.map((item) => {
    const food = foods.find((f) => f.id === item.foodId);
    const macros = food
      ? calculateFoodServingMacros(food, item.quantity)
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return { ...item, food, macros };
  });

  const totalMacros: MacroNutrients = sumMacros(resolvedItems.map((i) => i.macros));

  function handleShare() {
    // Future feature
  }

  async function handleLogDish() {
    await createMealLogEntryMutation.mutateAsync({
      source: 'favorite',
      total: totalMacros,
      favoriteDishId: currentDish.id,
      notes: currentDish.name,
    });
    setLoggedSuccess(true);
    setTimeout(() => router.replace('/(tabs)'), 800);
  }

  async function handleDelete() {
    await deleteFavoriteMutation.mutateAsync(currentDish.id);
    setShowDeleteModal(false);
    router.replace('/(tabs)/favorites');
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
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
              </Pressable>

              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleShare}
                  className="h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35"
                  accessibilityRole="button"
                  accessibilityLabel="Compartir receta"
                >
                  <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
                </Pressable>

                <Pressable
                  onPress={() => setShowDeleteModal(true)}
                  className="h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35"
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar receta"
                >
                  <Trash2 size={18} color="#f87171" strokeWidth={2} />
                </Pressable>
              </View>
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
              {currentDish.description ? (
                <Text className="mt-2 font-sans text-sm leading-5 text-white/80">{currentDish.description}</Text>
              ) : null}

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
                    {currentDish.servings} ración
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScreenTransition>

        {/* ── Banner de éxito si recién creada ── */}
        {justCreated === '1' && <JustCreatedBanner dishName={currentDish.name} />}

        <ScreenTransition delay={40} className="px-5 pt-5">
          <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Resumen nutricional</Text>

          <View className="mt-5 border-b border-border pb-5">
            <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorías</Text>
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
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        <ScreenTransition delay={80} className="px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Ingredientes</Text>
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-muted">{currentDish.servings} ración</Text>
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
                        {formatQuantity(item.quantity)}
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
          <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Elaboración</Text>

          {preparationSteps.length === 0 ? (
            <View className="mt-5 rounded-[20px] border border-dashed border-border px-4 py-6">
              <Text className="font-sans text-sm text-muted text-center">Sin pasos registrados</Text>
              <Text className="mt-1 font-sans text-xs text-muted text-center">Edita la receta para añadir pasos de preparación</Text>
            </View>
          ) : (
            <View className="mt-5">
              {preparationSteps.map((step, index) => (
                <View
                  key={`step-${index}`}
                  className={index === 0 ? 'flex-row gap-4 pb-5' : 'flex-row gap-4 border-t border-border py-5'}
                >
                  <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full border border-brand/20 bg-brand/15">
                    <Text className="font-mono text-xs text-brand">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 font-sans text-sm leading-6 text-secondary">{step}</Text>
                </View>
              ))}
            </View>
          )}
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
                    Disponible en la próxima iteración social del recetario.
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
                  <Text className="font-sans-medium text-sm text-primary">Extracción automática</Text>
                  <Text className="mt-1 font-sans text-sm leading-5 text-secondary">
                    Preparada para futuros flujos con foto o vídeo procesados por LLM.
                  </Text>
                </View>
              </View>
            </GlassPanel>
          </View>
        </ScreenTransition>
      </ScrollView>

      {/* ── Bottom bar ── */}
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

          <Button
            onPress={() => void handleLogDish()}
            disabled={createMealLogEntryMutation.isPending || loggedSuccess}
            accessibilityLabel="Registrar esta receta"
            className="h-12 flex-1 rounded-2xl"
          >
            {loggedSuccess ? (
              <>
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <UIText>Registrada</UIText>
              </>
            ) : (
              <UIText>Registrar esta receta</UIText>
            )}
          </Button>
        </View>
      </View>

      {/* ── Delete confirmation modal ── */}
      <ConfirmDeleteModal
        dishName={currentDish.name}
        visible={showDeleteModal}
        isDeleting={deleteFavoriteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}
