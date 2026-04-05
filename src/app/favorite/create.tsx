import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Camera, Check, Link2, Plus, Search, Sparkles, Trash2, X } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { NutritionGrid } from '@/components/NutritionGrid';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { aiQueryKeys } from '@/features/ai/queries/ai.query-keys';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import { useCreateFavoriteMutation } from '@/features/favorites/queries/use-favorite-mutations';
import { useCreateMealLogEntryMutation } from '@/features/logs/queries/use-logs-query';
import {
  calculateFoodServingMacros,
  getFoodDefaultServingAmount,
} from '@/utils/foodMeasurements';
import { sumMacros } from '@/utils/sumMacros';
import type { AiRecipeDraft, Food, MacroNutrients } from '@/types/nutrition';

// ─────────────────────────────────────────────────────────────────────────────
// Animation config — Telegram style: fast, no bounce, ease-out cubic
// ─────────────────────────────────────────────────────────────────────────────

const ANIM = {
  fast: { duration: 120, easing: Easing.out(Easing.cubic) },
  normal: { duration: 160, easing: Easing.out(Easing.cubic) },
  enter: { duration: 180, easing: Easing.out(Easing.cubic) },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Presión sutil: scale 0.97 → 1, sin bounce */
function ScalePressable({
  onPress,
  children,
  className,
  accessibilityRole,
  accessibilityLabel,
  hitSlop,
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  accessibilityRole?: 'button';
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={animStyle}
      onPressIn={() => { scale.value = withTiming(0.97, ANIM.fast); }}
      onPressOut={() => { scale.value = withTiming(1, ANIM.fast); }}
      onPress={onPress}
      className={className}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Botón de eliminar con feedback de opacidad rápido */
function DeleteButton({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handlePress() {
    opacity.value = withTiming(0.5, { duration: 60, easing: Easing.out(Easing.cubic) });
    setTimeout(() => { opacity.value = withTiming(1, ANIM.fast); }, 60);
    onPress();
  }

  return (
    <AnimatedPressable
      style={animStyle}
      onPress={handlePress}
      className="ml-1 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas active:bg-forest-panelAlt"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <X size={13} color="#70806E" strokeWidth={2} />
    </AnimatedPressable>
  );
}

/** Botón añadir ingrediente con scale suave */
function AddIngredientButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={containerStyle}
      onPressIn={() => { scale.value = withTiming(0.97, ANIM.fast); }}
      onPressOut={() => { scale.value = withTiming(1, ANIM.fast); }}
      onPress={onPress}
      className="mt-3 flex-row items-center gap-3 rounded-[20px] border border-dashed border-border px-4 py-3.5"
      accessibilityRole="button"
      accessibilityLabel="Anadir ingrediente"
    >
      <View className="h-7 w-7 items-center justify-center rounded-full bg-brand/10">
        <Plus size={13} color="#EC5B13" strokeWidth={2.5} />
      </View>
      <Text className="font-sans-medium text-sm text-secondary">Anadir ingrediente</Text>
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DishItem = {
  food: Food;
  quantity: number;
};

type CreationMode = 'manual' | 'photo' | 'youtube';

const creationModes: {
  id: CreationMode;
  title: string;
  description: string;
  icon: typeof Camera;
  accentClassName: string;
  iconColor: string;
}[] = [
  {
    id: 'manual',
    title: 'Manual',
    description: 'Construye tu receta paso a paso con ingredientes y cantidades exactas.',
    icon: Sparkles,
    accentClassName: 'bg-brand/10',
    iconColor: '#EC5B13',
  },
  {
    id: 'photo',
    title: 'Desde foto',
    description: 'Preparado para enviar una imagen a un LLM y detectar ingredientes automaticamente.',
    icon: Camera,
    accentClassName: 'bg-carbs/10',
    iconColor: '#60A5FA',
  },
  {
    id: 'youtube',
    title: 'Desde Short',
    description: 'Pega la URL de YouTube Shorts y dejaremos lista la futura extraccion desde transcripcion.',
    icon: Link2,
    accentClassName: 'bg-fat/10',
    iconColor: '#FBBF24',
  },
];

function resolveDraftItems(draft: AiRecipeDraft, foods: Food[]) {
  return draft.items
    .map((item) => {
      const food = foods.find((entry) => entry.id === item.foodId);
      return food ? { food, quantity: item.quantity } : null;
    })
    .filter((item): item is DishItem => Boolean(item));
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateFavoriteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: foods = [] } = useFoodsQuery('');
  const createFavoriteMutation = useCreateFavoriteMutation();
  const createMealLogEntryMutation = useCreateMealLogEntryMutation();
  const aiRecipeDraft = queryClient.getQueryData<AiRecipeDraft>(aiQueryKeys.selectedRecipeDraft());
  const [mode, setMode] = useState<CreationMode>('manual');
  const [name, setName] = useState('');
  const [items, setItems] = useState<DishItem[]>([]);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  // badge pulse cuando se añade un ingrediente
  const badgeScale = useSharedValue(1);
  const prevItemCount = useRef(0);

  useEffect(() => {
    if (items.length > prevItemCount.current) {
      badgeScale.value = withTiming(1.15, { duration: 100, easing: Easing.out(Easing.cubic) });
      setTimeout(() => { badgeScale.value = withTiming(1, ANIM.fast); }, 100);
    }
    prevItemCount.current = items.length;
  }, [items.length]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

  useEffect(() => {
    if (!aiRecipeDraft) {
      setHydratedDraftId(null);
      return;
    }

    if (hydratedDraftId === aiRecipeDraft.draftId) {
      return;
    }

    setMode('manual');
    setName(aiRecipeDraft.title);
    setItems(resolveDraftItems(aiRecipeDraft, foods));
    setCustomTags(aiRecipeDraft.tags.filter((tag) => tag !== 'Sugerida por AI' && tag !== aiRecipeDraft.modeLabel));
    setHydratedDraftId(aiRecipeDraft.draftId);
  }, [aiRecipeDraft, foods, hydratedDraftId]);

  const totalMacros: MacroNutrients = useMemo(() => {
    const macrosList = items.map((item) => calculateFoodServingMacros(item.food, item.quantity));
    return sumMacros(macrosList);
  }, [items]);

  const unresolvedIngredients = useMemo(() => {
    if (!aiRecipeDraft) {
      return [];
    }

    return aiRecipeDraft.items
      .filter((item) => !foods.some((food) => food.id === item.foodId))
      .map((item) => item.foodId);
  }, [aiRecipeDraft, foods]);

  const canSave = name.trim().length > 0 && items.length > 0 && unresolvedIngredients.length === 0;

  function addFood(food: Food) {
    setItems((prev) => [...prev, { food, quantity: getFoodDefaultServingAmount(food) }]);
    setShowFoodPicker(false);
    setFoodSearch('');
  }

  function removeFood(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, qty: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: Number(qty) || 0 } : item)));
  }

  async function handleSave() {
    const baseTags = aiRecipeDraft ? aiRecipeDraft.tags : ['Manual'];
    const tags = Array.from(new Set([...baseTags, ...customTags]));

    const createdDish = await createFavoriteMutation.mutateAsync({
      name: name.trim(),
      description: aiRecipeDraft?.description ?? 'Receta personalizada creada desde una sugerencia o desde tu recetario manual.',
      imageUri: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
      prepMinutes: 15,
      difficulty: 'Facil',
      servings: 1,
      tags,
      steps:
        aiRecipeDraft?.steps ?? ['Monta la receta con tus ingredientes guardados y repitela cuando quieras.'],
      items: items.map((item) => ({
        foodId: item.food.id,
        quantity: item.quantity,
      })),
    });

    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });

    Alert.alert('Receta creada', `"${name}" se ha guardado en el recetario.`, [
      {
        text: 'Guardar y registrar hoy',
        onPress: async () => {
          await createMealLogEntryMutation.mutateAsync({
            source: 'favorite',
            total: totalMacros,
            favoriteDishId: createdDish.id,
            notes: createdDish.name,
          });
          router.replace('/(tabs)');
        },
      },
      { text: 'Solo guardar', onPress: () => router.replace({ pathname: '/favorite/[id]', params: { id: createdDish.id } }) },
    ]);
  }

  function addCustomTag() {
    const normalizedTag = tagDraft.trim();

    if (!normalizedTag) {
      return;
    }

    setCustomTags((currentTags) => {
      if (currentTags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
        return currentTags;
      }

      return [...currentTags, normalizedTag];
    });
    setTagDraft('');
  }

  function removeCustomTag(tagToRemove: string) {
    setCustomTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  function handleFutureMode(modeName: string) {
    Alert.alert(modeName, 'Este flujo queda preparado visualmente para conectarlo a un LLM en la siguiente iteracion.');
  }

  function handleDiscardDraft() {
    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });
    setHydratedDraftId(null);
    setName('');
    setItems([]);
    setCustomTags([]);
    setTagDraft('');
    setShowFoodPicker(false);
    setFoodSearch('');
    Alert.alert('Borrador descartado', 'La propuesta AI se ha quitado y puedes seguir creando la receta manualmente.');
  }

  const availableFoods = foods.filter((f) => !items.some((i) => i.food.id === f.id));

  const filteredFoods = useMemo(() => {
    const query = foodSearch.trim().toLowerCase();
    if (!query) return availableFoods;
    return availableFoods.filter((f) => f.name.toLowerCase().includes(query));
  }, [availableFoods, foodSearch]);

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
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">ANADIR RECETA</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTransition className="px-5 pt-5">
          <Text className="font-sans text-sm text-secondary">Elige como quieres crearla</Text>
          <Text className="mt-1 font-sans-bold text-[30px] leading-[34px] text-primary">Nueva receta</Text>

          {aiRecipeDraft ? (
            <View className="mt-5 rounded-[28px] bg-forest-panelAlt px-5 py-5">
              <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Basado en una sugerencia AI</Text>
              <Text className="mt-3 font-sans-medium text-base text-primary">{aiRecipeDraft.modeLabel}</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">{aiRecipeDraft.whyItFits}</Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {aiRecipeDraft.items.map((ingredient) => {
                  const food = foods.find((entry) => entry.id === ingredient.foodId);

                  return (
                    <View key={`${ingredient.foodId}-${ingredient.quantity}`} className="rounded-full border border-forest-line bg-surface px-3 py-2">
                      <Text className="font-sans text-xs text-primary">
                        {food?.name ?? ingredient.foodId} · {ingredient.quantity} g
                      </Text>
                    </View>
                  );
                })}
              </View>
              {unresolvedIngredients.length > 0 ? (
                <Text className="mt-3 font-sans text-sm leading-6 text-secondary">
                  Te faltan por resolver estos alimentos del draft: {unresolvedIngredients.join(', ')}.
                </Text>
              ) : null}
              <Button
                variant="outline"
                className="mt-4"
                onPress={() => router.push('/ai/suggestions')}
                accessibilityLabel="Volver a sugerencias manteniendo la propuesta"
              >
                <UIText>Volver a sugerencias</UIText>
              </Button>
              <Button
                variant="secondary"
                className="mt-3"
                onPress={handleDiscardDraft}
                accessibilityLabel="Descartar propuesta AI"
              >
                <UIText>Descartar propuesta AI</UIText>
              </Button>
            </View>
          ) : null}

          <View className="mt-5 rounded-[32px] border border-border bg-surface/90 px-5 py-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Recetario personal</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  Crea recetas reutilizables con ingredientes bien medidos, contexto de compra y futura automatizacion desde foto o video.
                </Text>
              </View>

              <View className="rounded-full bg-brand/10 px-3 py-2">
                <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-brand">Builder</Text>
              </View>
            </View>
          </View>

          <View className="mt-5 gap-3">
            {creationModes.map((creationMode) => {
              const Icon = creationMode.icon;
              const isActive = creationMode.id === mode;

              return (
                <Pressable
                  key={creationMode.id}
                  onPress={() => setMode(creationMode.id)}
                  className={`rounded-[28px] border px-4 py-4 ${isActive ? 'border-brand bg-forest-panelAlt' : 'border-border bg-surface/90'}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar modo ${creationMode.title}`}
                >
                  <View className="flex-row items-start gap-3">
                    <View className={`h-11 w-11 items-center justify-center rounded-full ${creationMode.accentClassName}`}>
                      <Icon size={18} color={creationMode.iconColor} strokeWidth={2} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="font-sans-medium text-base text-primary">{creationMode.title}</Text>
                        <View className={`h-5 w-5 rounded-full border ${isActive ? 'border-brand bg-brand' : 'border-border bg-transparent'}`} />
                      </View>
                      <Text className="mt-1 font-sans text-sm leading-5 text-secondary">{creationMode.description}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        {mode === 'manual' ? (
          <>
            <ScreenTransition delay={40} className="px-5">
              <Label nativeID="dish-name">Nombre de la receta</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Ej. bowl de pollo para diario"
                className="mt-1.5"
                accessibilityLabelledBy="dish-name"
                accessibilityLabel="Nombre de la receta"
              />
            </ScreenTransition>

            <ScreenTransition delay={80} className="px-5">
              {/* ── Sección header ── */}
              <View className="mt-6 flex-row items-center justify-between">
                <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Ingredientes</Text>
                {items.length > 0 && (
                  <Animated.View
                    style={badgeStyle}
                    className="rounded-full bg-forest-panelAlt px-2.5 py-1"
                  >
                    <Text className="font-mono text-[10px] tabular-nums text-brand">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* ── Alerta ingredientes sin resolver ── */}
              {unresolvedIngredients.length > 0 ? (
                <Animated.View
                  entering={FadeInDown.duration(160)}
                  exiting={FadeOut.duration(120)}
                  className="mt-3 rounded-[20px] border border-brand/30 bg-brand/8 px-4 py-4"
                >
                  <Text className="font-sans-medium text-sm text-primary">Ingredientes sin resolver</Text>
                  <Text className="mt-1.5 font-sans text-sm leading-6 text-secondary">
                    Crea estos alimentos antes de guardar: {unresolvedIngredients.join(', ')}.
                  </Text>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onPress={() => router.push('/food/add')}
                    accessibilityLabel="Anadir alimento base pendiente"
                  >
                    <UIText>Anadir alimento base</UIText>
                  </Button>
                </Animated.View>
              ) : null}

              {/* ── Lista de ingredientes con layout animado ── */}
              {items.length === 0 && !showFoodPicker ? (
                <Animated.View
                  entering={FadeIn.duration(140)}
                  exiting={FadeOut.duration(100)}
                  className="mt-3 items-center rounded-[20px] border border-dashed border-border py-8"
                >
                  <Text className="font-sans text-sm text-muted">Sin ingredientes todavia</Text>
                  <Text className="mt-1 font-sans text-xs text-muted">Pulsa el boton para anadir</Text>
                </Animated.View>
              ) : (
                <Animated.View
                  layout={LinearTransition.duration(160)}
                  className="mt-3 gap-2.5"
                >
                  {items.map((item, index) => {
                    const servingMacros = calculateFoodServingMacros(item.food, item.quantity);
                    return (
                      <Animated.View
                        key={item.food.id}
                        entering={FadeInDown.duration(150)}
                        exiting={FadeOutUp.duration(120)}
                        layout={LinearTransition.duration(160)}
                        className="overflow-hidden rounded-[20px] border border-border bg-surface/90"
                      >
                        {/* Franja superior */}
                        <View className="h-px bg-forest-line" />

                        <View className="flex-row items-center gap-3 px-4 py-4">
                          {/* Índice numérico */}
                          <View className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-panelAlt">
                            <Text className="font-mono text-[11px] text-secondary">{index + 1}</Text>
                          </View>

                          {/* Nombre + resumen de macros */}
                          <View className="min-w-0 flex-1">
                            <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
                              {item.food.name}
                            </Text>
                            <View className="mt-1 flex-row items-center gap-2">
                              <Text className="font-mono text-[11px] tabular-nums text-brand">
                                {Math.round(servingMacros.calories)} kcal
                              </Text>
                              <View className="h-3 w-px bg-border" />
                              <Text className="font-mono text-[11px] tabular-nums text-protein">
                                {servingMacros.protein.toFixed(1)}g P
                              </Text>
                              <View className="h-3 w-px bg-border" />
                              <Text className="font-mono text-[11px] tabular-nums text-carbs">
                                {servingMacros.carbs.toFixed(1)}g C
                              </Text>
                            </View>
                          </View>

                          {/* Input de cantidad */}
                          <View className="shrink-0 flex-row items-center gap-1.5">
                            <Input
                              value={String(item.quantity)}
                              onChangeText={(value) => updateQuantity(index, value)}
                              className="h-9 w-16 px-2 text-center text-sm"
                              inputMode="decimal"
                              accessibilityLabel={`Cantidad para ${item.food.name}`}
                            />
                            <Text className="font-sans text-xs text-muted">g</Text>
                          </View>

                          {/* Botón eliminar con shake */}
                          <DeleteButton
                            onPress={() => removeFood(index)}
                            accessibilityLabel={`Quitar ${item.food.name}`}
                          />
                        </View>
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              )}

              {/* ── Botón añadir ingrediente con icono rotante ── */}
              {!showFoodPicker && (
                <AddIngredientButton onPress={() => { setFoodSearch(''); setShowFoodPicker(true); }} />
              )}

              {/* ── Food picker con slide animado ── */}
              {showFoodPicker && (
                <Animated.View
                  entering={FadeInDown.duration(160)}
                  exiting={FadeOutUp.duration(120)}
                  className="mt-3 overflow-hidden rounded-[20px] border border-brand/40 bg-forest-panelAlt"
                >
                  {/* Header */}
                  <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <Animated.View
                        entering={FadeIn.duration(120).delay(60)}
                        className="h-5 w-5 items-center justify-center rounded-full bg-brand/15"
                      >
                        <Plus size={11} color="#EC5B13" strokeWidth={2.5} />
                      </Animated.View>
                      <Text className="font-sans text-[11px] tracking-widest uppercase text-secondary">
                        Elegir alimento
                      </Text>
                      {availableFoods.length > 0 && (
                        <Animated.View
                          entering={FadeIn.duration(120).delay(40)}
                          className="rounded-full bg-surface px-2 py-0.5"
                        >
                          <Text className="font-mono text-[10px] tabular-nums text-muted">
                            {filteredFoods.length}
                            {foodSearch.trim() ? `/${availableFoods.length}` : ''}
                          </Text>
                        </Animated.View>
                      )}
                    </View>
                    <ScalePressable
                      onPress={() => { setShowFoodPicker(false); setFoodSearch(''); }}
                      className="h-7 w-7 items-center justify-center rounded-full bg-surface"
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar seleccion"
                      hitSlop={8}
                    >
                      <X size={13} color="#A9B8A8" strokeWidth={2} />
                    </ScalePressable>
                  </View>

                  {/* Buscador */}
                  <Animated.View
                    entering={FadeIn.duration(120).delay(30)}
                    className="border-b border-border px-4 py-2.5"
                  >
                    <View className="flex-row items-center gap-2.5 rounded-[12px] bg-surface px-3 py-2">
                      <Search size={13} color="#70806E" strokeWidth={2} />
                      <TextInput
                        ref={searchInputRef}
                        value={foodSearch}
                        onChangeText={setFoodSearch}
                        placeholder="Buscar alimento..."
                        placeholderTextColor="#4A5A49"
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                        className="flex-1 font-sans text-sm text-primary"
                        style={{ height: 24, padding: 0 }}
                        accessibilityLabel="Buscar alimento"
                      />
                      {foodSearch.length > 0 && (
                        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(80)}>
                          <Pressable
                            onPress={() => setFoodSearch('')}
                            hitSlop={6}
                            accessibilityLabel="Limpiar busqueda"
                          >
                            <X size={12} color="#70806E" strokeWidth={2} />
                          </Pressable>
                        </Animated.View>
                      )}
                    </View>
                  </Animated.View>

                  {/* Listado filtrado */}
                  {filteredFoods.length === 0 ? (
                    <Animated.View
                      entering={FadeIn.duration(120)}
                      className="items-center px-4 py-8"
                    >
                      {availableFoods.length === 0 ? (
                        <Text className="font-sans text-sm text-muted">Todos los alimentos añadidos</Text>
                      ) : (
                        <>
                          <Text className="font-sans text-sm text-muted">Sin resultados para</Text>
                          <Text className="mt-0.5 font-sans-medium text-sm text-secondary">"{foodSearch}"</Text>
                        </>
                      )}
                    </Animated.View>
                  ) : (
                    filteredFoods.map((food, index) => {
                      const defaultMacros = calculateFoodServingMacros(food, getFoodDefaultServingAmount(food));
                      return (
                        <Animated.View
                          key={food.id}
                          entering={FadeIn.duration(120).delay(index * 20)}
                        >
                          <ScalePressable
                            onPress={() => addFood(food)}
                            className={`flex-row items-center justify-between px-4 py-3.5 ${index > 0 ? 'border-t border-border' : ''}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Seleccionar ${food.name}`}
                          >
                            <View className="min-w-0 flex-1">
                              <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
                                {food.name}
                              </Text>
                              <View className="mt-0.5 flex-row items-center gap-2">
                                <Text className="font-mono text-[10px] tabular-nums text-brand">
                                  {Math.round(defaultMacros.calories)} kcal
                                </Text>
                                <Text className="font-sans text-[10px] text-muted">
                                  / {food.defaultServingAmount ?? food.referenceAmount}g
                                </Text>
                              </View>
                            </View>
                            <View className="ml-3 h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/8">
                              <Plus size={13} color="#EC5B13" strokeWidth={2.5} />
                            </View>
                          </ScalePressable>
                        </Animated.View>
                      );
                    })
                  )}
                </Animated.View>
              )}
            </ScreenTransition>

            <Separator className="mx-5 my-4" />

            <ScreenTransition delay={100} className="px-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">TAGS PERSONALIZADAS</Text>
                <Text className="font-sans text-xs text-secondary">Opcional</Text>
              </View>

              <View className="mt-3 rounded-[26px] border border-border bg-surface/75 px-4 py-4">
                <Text className="font-sans text-sm leading-6 text-secondary">
                  Puedes anadir tus propias etiquetas para clasificar recetas por uso, contexto o estilo de comida.
                </Text>
              </View>

              <View className="mt-4 flex-row items-center gap-3">
                <Input
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  placeholder="Ej. postentreno, tupper"
                  className="flex-1"
                  accessibilityLabel="Nueva tag personalizada"
                  onSubmitEditing={addCustomTag}
                />
                <Button variant="outline" onPress={addCustomTag} accessibilityLabel="Anadir tag personalizada">
                  <UIText>Anadir</UIText>
                </Button>
              </View>

              {customTags.length > 0 ? (
                <Animated.View
                  layout={LinearTransition.duration(140)}
                  className="mt-4 flex-row flex-wrap gap-2"
                >
                  {customTags.map((tag) => (
                    <Animated.View
                      key={tag}
                      entering={FadeIn.duration(120)}
                      exiting={FadeOut.duration(100)}
                      layout={LinearTransition.duration(140)}
                    >
                      <Pressable
                        onPress={() => removeCustomTag(tag)}
                        className="rounded-full border border-border bg-forest-panelAlt px-3 py-2"
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar tag ${tag}`}
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="font-sans text-xs text-primary">{tag}</Text>
                          <Trash2 size={12} color="#F5F7F2" strokeWidth={2} />
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              ) : null}
            </ScreenTransition>

            {items.length > 0 ? (
              <>
                <Separator className="mx-5 my-4" />
                <Animated.View
                  entering={FadeInDown.duration(160)}
                  className="px-5"
                >
                  <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">TOTAL NUTRICIONAL</Text>
                  <View className="mt-4 border-b border-border pb-4">
                    <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorias estimadas</Text>
                    <Text className="mt-2 font-sans-bold text-[38px] text-primary">{Math.round(totalMacros.calories)}</Text>
                    <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-brand">kcal de la receta</Text>
                  </View>
                  <NutritionGrid macros={totalMacros} size="sm" className="mt-3" />
                </Animated.View>
              </>
            ) : null}
          </>
        ) : null}

        {mode === 'photo' ? (
          <ScreenTransition delay={40} className="px-5">
            <GlassPanel className="px-5 py-5">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-carbs/10">
                <Camera size={22} color="#60A5FA" strokeWidth={2} />
              </View>
              <Text className="mt-4 font-sans-bold text-xl text-primary">Importar desde una foto</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Aqui conectaremos una imagen del plato o de una receta escrita para extraer ingredientes, pasos y estructura con un LLM.
              </Text>

              <View className="mt-4 gap-3">
                <View className="rounded-[22px] border border-border bg-forest-panelAlt px-4 py-4">
                  <Text className="font-sans-medium text-sm text-primary">Flujo previsto</Text>
                  <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                    1. Subir foto. 2. Detectar ingredientes. 3. Generar receta editable. 4. Guardar al recetario.
                  </Text>
                </View>
              </View>

              <Button onPress={() => handleFutureMode('Desde foto')} className="mt-5" accessibilityLabel="Probar flujo futuro desde foto">
                <UIText>Dejar preparado este flujo</UIText>
              </Button>
            </GlassPanel>
          </ScreenTransition>
        ) : null}

        {mode === 'youtube' ? (
          <ScreenTransition delay={40} className="px-5">
            <GlassPanel className="px-5 py-5">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-fat/10">
                <Link2 size={22} color="#FBBF24" strokeWidth={2} />
              </View>
              <Text className="mt-4 font-sans-bold text-xl text-primary">Importar desde YouTube Short</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Pegaremos la URL del short, extraeremos la descripcion o transcripcion y luego construiremos la receta automaticamente.
              </Text>

              <View className="mt-4">
                <Label nativeID="youtube-url">URL del short</Label>
                <Input
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://youtube.com/shorts/..."
                  className="mt-1.5"
                  accessibilityLabelledBy="youtube-url"
                  accessibilityLabel="URL de YouTube Short"
                  autoCapitalize="none"
                />
              </View>

              <GlassPanel className="mt-4 px-4 py-4">
                <Text className="font-sans-medium text-sm text-primary">Pipeline futura</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  URL - descripcion/transcripcion - LLM - receta editable - confirmacion manual.
                </Text>
              </GlassPanel>

              <Button onPress={() => handleFutureMode('Desde YouTube Short')} className="mt-5" accessibilityLabel="Preparar flujo desde YouTube Short">
                <UIText>Preparar importacion</UIText>
              </Button>
            </GlassPanel>
          </ScreenTransition>
        ) : null}
      </ScrollView>

      {mode === 'manual' ? (
        <View className="border-t border-border bg-surface px-5 py-4">
          <Button onPress={() => void handleSave()} disabled={!canSave} accessibilityLabel="Guardar receta">
            <Check size={16} color="#FFFFFF" strokeWidth={2} />
            <UIText>Guardar receta</UIText>
          </Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
