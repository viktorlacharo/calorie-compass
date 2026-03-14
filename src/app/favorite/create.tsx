import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Check, ChevronRight, Link2, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { SUPERMARKETS } from '@/constants/supermarkets';
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
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import type { AiRecipeDraft, Food, MacroNutrients, Supermarket } from '@/types/nutrition';

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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

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
    const macrosList = items.map((item) => calculatePerServing(item.food.per100g, item.quantity));
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
    setItems((prev) => [...prev, { food, quantity: food.servingSize }]);
    setShowFoodPicker(false);
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
        unit: item.food.servingUnit,
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
    Alert.alert('Borrador descartado', 'La propuesta AI se ha quitado y puedes seguir creando la receta manualmente.');
  }

  const availableFoods = foods.filter((f) => !items.some((i) => i.food.id === f.id));

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
                    <View key={`${ingredient.foodId}-${ingredient.quantity}-${ingredient.unit}`} className="rounded-full border border-forest-line bg-surface px-3 py-2">
                      <Text className="font-sans text-xs text-primary">
                        {food?.name ?? ingredient.foodId} · {ingredient.quantity} {ingredient.unit}
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

              <View className="mt-5 flex-row items-center justify-between">
                <Label nativeID="dish-store">Supermercado habitual</Label>
                <Pressable
                  onPress={() => setSupermarket(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar supermercado seleccionado"
                >
                  <Text className="font-sans-medium text-xs text-secondary">Opcional</Text>
                </Pressable>
              </View>

              <View className="mt-3 flex-row flex-wrap gap-3">
                {SUPERMARKETS.map((store) => {
                  const isActive = supermarket === store.id;

                  return (
                    <Pressable
                      key={store.id}
                      onPress={() => setSupermarket((current) => (current === store.id ? null : store.id))}
                      className={`min-w-[31%] flex-1 rounded-[24px] border px-3 py-3 ${isActive ? 'border-brand bg-forest-panelAlt' : 'border-border bg-surface/90'}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${store.label}`}
                    >
                      <View className="items-center gap-2">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/90">
                          <Image source={store.logo} className="h-7 w-7" resizeMode="contain" />
                        </View>
                        <Text className="font-sans text-[11px] uppercase tracking-[1.1px] text-secondary">{store.label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScreenTransition>

            <Separator className="mx-5 my-4" />

            <ScreenTransition delay={70} className="px-5">
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
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <Pressable
                      key={tag}
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
                  ))}
                </View>
              ) : null}
            </ScreenTransition>

            <ScreenTransition delay={80} className="px-5">
              <View className="flex-row items-center mt-4 justify-between">
                <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">INGREDIENTES</Text>
                <Text className="font-mono text-[10px] tabular-nums text-muted">
                  {items.length} {items.length === 1 ? 'ingrediente' : 'ingredientes'}
                </Text>
              </View>

              <View className="mt-3 rounded-[26px] border border-border bg-surface/75 px-4 py-4">
                <Text className="font-sans text-sm leading-6 text-secondary">
                  Anade los ingredientes que vas a repetir con frecuencia. Asi el registro sera rapido y mantendra la misma logica de macros siempre.
                </Text>
              </View>

              {unresolvedIngredients.length > 0 ? (
                <View className="mt-3 rounded-[26px] border border-border bg-brand/10 px-4 py-4">
                  <Text className="font-sans-medium text-sm text-primary">Ingredientes pendientes por resolver</Text>
                  <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                    Antes de guardar la receta, crea o vincula estos alimentos en tu base: {unresolvedIngredients.join(', ')}.
                  </Text>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onPress={() => router.push('/food/add')}
                    accessibilityLabel="Anadir alimento base pendiente"
                  >
                    <UIText>Anadir alimento base</UIText>
                  </Button>
                </View>
              ) : null}

              {items.map((item, index) => (
                <GlassPanel key={item.food.id} className="mt-3 px-5 py-5">
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1">
                      <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
                        {item.food.name}
                      </Text>
                      <View className="mt-2 flex-row items-center gap-2">
                        <Input
                          value={String(item.quantity)}
                          onChangeText={(value) => updateQuantity(index, value)}
                          className="h-10 w-20 px-3 text-sm"
                          inputMode="decimal"
                          accessibilityLabel={`Cantidad para ${item.food.name}`}
                        />
                        <Text className="font-sans text-xs text-secondary">{item.food.servingUnit}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => removeFood(index)}
                      className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-fat/10"
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${item.food.name}`}
                    >
                      <Plus size={14} color="#FBBF24" strokeWidth={2} style={{ transform: [{ rotate: '45deg' }] }} />
                    </Pressable>
                  </View>
                </GlassPanel>
              ))}

              {!showFoodPicker && (
                <Pressable
                  onPress={() => setShowFoodPicker(true)}
                  className="mt-3 flex-row items-center justify-center gap-2 rounded-[24px] border border-dashed border-border py-4 active:bg-surface"
                  accessibilityRole="button"
                  accessibilityLabel="Anadir ingrediente"
                >
                  <Plus size={14} color="#78716C" strokeWidth={2} />
                  <Text className="font-sans-medium text-xs text-secondary">Anadir ingrediente</Text>
                </Pressable>
              )}

              {showFoodPicker && (
                <GlassPanel className="mt-3 px-4 py-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-[10px] tracking-widest uppercase text-muted">ELIGE UN ALIMENTO</Text>
                    <Pressable onPress={() => setShowFoodPicker(false)} accessibilityRole="button" accessibilityLabel="Cancelar seleccion">
                      <Text className="font-sans-medium text-xs text-secondary">Cancelar</Text>
                    </Pressable>
                  </View>

                  {availableFoods.length === 0 ? (
                    <View className="px-3 py-4">
                      <Text className="text-center font-sans text-xs text-muted">Ya has anadido todos los alimentos</Text>
                    </View>
                  ) : (
                    availableFoods.map((food, index) => (
                      <Pressable
                        key={food.id}
                        onPress={() => addFood(food)}
                        className={`flex-row items-center justify-between px-2 py-3 active:bg-canvas ${index === 0 ? 'mt-3' : 'border-t border-border'}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar ${food.name}`}
                      >
                        <Text className="font-sans text-sm text-primary">{food.name}</Text>
                        <ChevronRight size={14} color="#78716C" strokeWidth={2} />
                      </Pressable>
                    ))
                  )}
                </GlassPanel>
              )}
            </ScreenTransition>

            {items.length > 0 ? (
              <>
                <Separator className="mx-5 my-4" />
                <ScreenTransition delay={120} className="px-5">
                  <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">TOTAL NUTRICIONAL</Text>
                  <View className="mt-4 border-b border-border pb-4">
                    <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorias estimadas</Text>
                    <Text className="mt-2 font-sans-bold text-[38px] text-primary">{Math.round(totalMacros.calories)}</Text>
                    <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-brand">kcal de la receta</Text>
                  </View>
                  <NutritionGrid macros={totalMacros} size="sm" className="mt-3" />
                </ScreenTransition>
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
