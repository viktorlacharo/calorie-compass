import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChefHat,
  Clock3,
  Image as ImageIcon,
  Link2,
  ListOrdered,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { ScrubInput } from '@/components/ScrubInput';
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
// Animation config
// ─────────────────────────────────────────────────────────────────────────────

const ANIM = {
  fast: { duration: 120, easing: Easing.out(Easing.cubic) },
  normal: { duration: 160, easing: Easing.out(Easing.cubic) },
  enter: { duration: 180, easing: Easing.out(Easing.cubic) },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function ScalePressable({
  onPress,
  children,
  className,
  accessibilityRole,
  accessibilityLabel,
  hitSlop,
  disabled,
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  accessibilityRole?: 'button';
  accessibilityLabel?: string;
  hitSlop?: number;
  disabled?: boolean;
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
      disabled={disabled}
    >
      {children}
    </AnimatedPressable>
  );
}

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
      <Text className="font-sans-medium text-sm text-secondary">Añadir ingrediente</Text>
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step progress bar
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Info', icon: ImageIcon },
  { id: 2, label: 'Ingredientes', icon: ChefHat },
  { id: 3, label: 'Preparación', icon: ListOrdered },
] as const;

function StepProgressBar({
  currentStep,
  canGoToStep,
  onStepPress,
}: {
  currentStep: number;
  canGoToStep: (step: number) => boolean;
  onStepPress: (step: number) => void;
}) {
  return (
    <View className="px-5 pb-4 pt-3">
      <View className="flex-row items-center gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const canPress = canGoToStep(step.id);

          return (
            <View key={step.id} className="flex-row items-center flex-1">
              <ScalePressable
                onPress={() => onStepPress(step.id)}
                disabled={!canPress}
                className={`flex-1 items-center rounded-[20px] px-1 py-2 ${canPress ? '' : 'opacity-45'}`}
                accessibilityRole="button"
                accessibilityLabel={`Ir al paso ${step.label}`}
              >
                <Animated.View
                  layout={LinearTransition.duration(160)}
                  className={`h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    isCompleted
                      ? 'border-brand bg-brand'
                      : isActive
                      ? 'border-brand bg-brand/15'
                      : 'border-border bg-surface'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Icon size={12} color={isActive ? '#EC5B13' : '#4A5A49'} strokeWidth={2} />
                  )}
                </Animated.View>
                <View className="mt-2 items-center justify-center">
                  <Text
                    className={`text-center font-sans text-[10px] uppercase tracking-[1.2px] ${
                      isActive ? 'text-primary' : isCompleted ? 'text-brand' : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </Text>
                </View>
              </ScalePressable>

              {index < STEPS.length - 1 && (
                <Animated.View
                  layout={LinearTransition.duration(160)}
                  className={`mx-2 h-px flex-1 ${isCompleted ? 'bg-brand/40' : 'bg-border'}`}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty + metadata selectors
// ─────────────────────────────────────────────────────────────────────────────

type Difficulty = 'Facil' | 'Media' | 'Alta';
const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'Facil', label: 'Fácil', color: '#4ade80', bg: 'bg-protein/10' },
  { value: 'Media', label: 'Media', color: '#FBBF24', bg: 'bg-fat/10' },
  { value: 'Alta', label: 'Alta', color: '#f87171', bg: 'bg-red-400/10' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DishItem = { food: Food; quantity: number };
type CreationMode = 'manual' | 'photo' | 'youtube';
type StepDirection = 'forward' | 'backward';

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
    description: 'Preparado para enviar una imagen a un LLM y detectar ingredientes automáticamente.',
    icon: Camera,
    accentClassName: 'bg-carbs/10',
    iconColor: '#60A5FA',
  },
  {
    id: 'youtube',
    title: 'Desde Short',
    description: 'Pega la URL de YouTube Shorts para futura extracción desde transcripción.',
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
// Step 1: Info básica (nombre, descripción, imagen, metadatos)
// ─────────────────────────────────────────────────────────────────────────────

function Step1Info({
  name,
  setName,
  description,
  setDescription,
  imageUri,
  setImageUri,
  prepMinutes,
  setPrepMinutes,
  difficulty,
  setDifficulty,
  servings,
  setServings,
  mode,
  setMode,
  youtubeUrl,
  setYoutubeUrl,
  aiRecipeDraft,
  foods,
  hydratedDraftId,
  setHydratedDraftId,
  unresolvedIngredients,
  onDiscardDraft,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUri: string;
  setImageUri: (v: string) => void;
  prepMinutes: number;
  setPrepMinutes: (v: number) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  servings: number;
  setServings: (v: number) => void;
  mode: CreationMode;
  setMode: (v: CreationMode) => void;
  youtubeUrl: string;
  setYoutubeUrl: (v: string) => void;
  aiRecipeDraft: AiRecipeDraft | undefined;
  foods: Food[];
  hydratedDraftId: string | null;
  setHydratedDraftId: (v: string | null) => void;
  unresolvedIngredients: string[];
  onDiscardDraft: () => void;
}) {
  const router = useRouter();

  function updatePrepMinutes(nextValue: string) {
    const parsed = Number(nextValue.replace(',', '.'));
    setPrepMinutes(Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0);
  }

  function updateServings(nextValue: string) {
    const parsed = Number(nextValue.replace(',', '.'));
    setServings(Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTransition className="px-5 pt-5">
        {/* ── Mode selector ── */}
        <View className="gap-3">
          {creationModes.map((creationMode) => {
            const Icon = creationMode.icon;
            const isActive = creationMode.id === mode;
            return (
              <ScalePressable
                key={creationMode.id}
                onPress={() => setMode(creationMode.id)}
                className={`rounded-[24px] border px-4 py-4 ${isActive ? 'border-brand bg-forest-panelAlt' : 'border-border bg-surface/90'}`}
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar modo ${creationMode.title}`}
              >
                <View className="flex-row items-start gap-3">
                  <View className={`h-10 w-10 items-center justify-center rounded-full ${creationMode.accentClassName}`}>
                    <Icon size={17} color={creationMode.iconColor} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="font-sans-medium text-sm text-primary">{creationMode.title}</Text>
                      <Animated.View
                        layout={LinearTransition.duration(160)}
                        className={`h-4 w-4 rounded-full border ${isActive ? 'border-brand bg-brand' : 'border-border bg-transparent'}`}
                      />
                    </View>
                    <Text className="mt-1 font-sans text-xs leading-5 text-secondary">{creationMode.description}</Text>
                  </View>
                </View>
              </ScalePressable>
            );
          })}
        </View>
      </ScreenTransition>

      {mode !== 'manual' && (
        <ScreenTransition delay={40} className="px-5 mt-5">
          <GlassPanel className="px-5 py-5">
            <View className={`h-12 w-12 items-center justify-center rounded-full ${mode === 'photo' ? 'bg-carbs/10' : 'bg-fat/10'}`}>
              {mode === 'photo' ? (
                <Camera size={20} color="#60A5FA" strokeWidth={2} />
              ) : (
                <Link2 size={20} color="#FBBF24" strokeWidth={2} />
              )}
            </View>
            <Text className="mt-4 font-sans-bold text-lg text-primary">
              {mode === 'photo' ? 'Importar desde foto' : 'Importar desde YouTube Short'}
            </Text>
            <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
              {mode === 'photo'
                ? 'Aquí conectaremos una imagen del plato para extraer ingredientes y pasos con IA.'
                : 'Pegaremos la URL del short, extraeremos la transcripción y construiremos la receta automáticamente.'}
            </Text>
            {mode === 'youtube' && (
              <View className="mt-4">
                <Label nativeID="youtube-url">URL del short</Label>
                <Input
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://youtube.com/shorts/..."
                  className="mt-1.5"
                  accessibilityLabelledBy="youtube-url"
                  autoCapitalize="none"
                />
              </View>
            )}
            <View className="mt-4 rounded-[18px] border border-border bg-forest-panelAlt px-4 py-3">
              <Text className="font-sans text-xs leading-5 text-muted">
                Flujo previsto: {mode === 'photo' ? '1. Subir foto → 2. Detectar ingredientes → 3. Receta editable → 4. Guardar.' : 'URL → descripción/transcripción → LLM → receta editable → confirmación manual.'}
              </Text>
            </View>
          </GlassPanel>
        </ScreenTransition>
      )}

      {mode === 'manual' && (
        <>
          {/* ── AI Draft banner ── */}
          {aiRecipeDraft && (
            <Animated.View entering={FadeInDown.duration(160)} className="mx-5 mt-5 rounded-[24px] bg-forest-panelAlt px-5 py-5">
              <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Basado en sugerencia AI</Text>
              <Text className="mt-2 font-sans-medium text-base text-primary">{aiRecipeDraft.modeLabel}</Text>
              <Text className="mt-1.5 font-sans text-sm leading-6 text-secondary">{aiRecipeDraft.whyItFits}</Text>
              {unresolvedIngredients.length > 0 && (
                <Text className="mt-3 font-sans text-xs leading-5 text-brand">
                  Ingredientes sin resolver: {unresolvedIngredients.join(', ')}
                </Text>
              )}
              <View className="mt-4 flex-row gap-2">
                <Button variant="outline" className="flex-1" onPress={() => router.push('/ai/suggestions')}>
                  <UIText>Ver sugerencias</UIText>
                </Button>
                <Button variant="secondary" className="flex-1" onPress={onDiscardDraft}>
                  <UIText>Descartar</UIText>
                </Button>
              </View>
            </Animated.View>
          )}

          <Separator className="mx-5 my-5" />

          <ScreenTransition delay={40} className="px-5 gap-5">
            {/* ── Nombre ── */}
            <View>
              <Label nativeID="dish-name">Nombre de la receta *</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Ej. Bowl de pollo y arroz"
                className="mt-1.5"
                accessibilityLabelledBy="dish-name"
              />
            </View>

            {/* ── Descripción ── */}
            <View>
              <View className="flex-row items-center justify-between">
                <Label nativeID="dish-desc">Descripción</Label>
                <Text className="font-sans text-xs text-muted">Opcional</Text>
              </View>
              <View className="mt-1.5 rounded-[14px] border border-border bg-surface/90 px-4 py-3">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe brevemente el plato, cuándo lo comes, cómo te sienta…"
                  placeholderTextColor="#4A5A49"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="font-sans text-sm text-primary"
                  style={{ minHeight: 72 }}
                  accessibilityLabel="Descripción de la receta"
                />
              </View>
            </View>

            {/* ── Imagen ── */}
            <View>
              <View className="flex-row items-center justify-between">
                <Label nativeID="dish-image">Imagen</Label>
                <Text className="font-sans text-xs text-muted">Opcional — S3 próximamente</Text>
              </View>
              {imageUri ? (
                <Animated.View entering={FadeIn.duration(200)} className="mt-2">
                  <View className="relative overflow-hidden rounded-[18px]">
                    <Image
                      source={{ uri: imageUri }}
                      className="h-44 w-full"
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => setImageUri('')}
                      className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/50"
                      accessibilityRole="button"
                      accessibilityLabel="Quitar imagen"
                    >
                      <X size={15} color="#FFFFFF" strokeWidth={2} />
                    </Pressable>
                  </View>
                  <View className="mt-2 flex-row gap-2">
                    <Button variant="outline" className="flex-1" onPress={pickImage}>
                      <ImageIcon size={14} color="#A9B8A8" strokeWidth={2} />
                      <UIText>Cambiar</UIText>
                    </Button>
                  </View>
                </Animated.View>
              ) : (
                <View className="mt-2 flex-row gap-2">
                  <ScalePressable
                    onPress={pickImage}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border border-dashed border-border bg-surface/60 py-5"
                    accessibilityRole="button"
                    accessibilityLabel="Elegir imagen de galería"
                  >
                    <ImageIcon size={18} color="#70806E" strokeWidth={1.8} />
                    <Text className="font-sans text-sm text-secondary">Galería</Text>
                  </ScalePressable>
                  <ScalePressable
                    onPress={takePhoto}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border border-dashed border-border bg-surface/60 py-5"
                    accessibilityRole="button"
                    accessibilityLabel="Tomar foto con cámara"
                  >
                    <Camera size={18} color="#70806E" strokeWidth={1.8} />
                    <Text className="font-sans text-sm text-secondary">Cámara</Text>
                  </ScalePressable>
                </View>
              )}
            </View>

            {/* ── Metadatos: tiempo, dificultad, raciones ── */}
            <View>
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary mb-3">Metadatos</Text>

              {/* Dificultad */}
              <Text className="font-sans text-xs text-muted mb-2">Dificultad</Text>
              <View className="flex-row gap-2 mb-4">
                {DIFFICULTIES.map((d) => (
                  <ScalePressable
                    key={d.value}
                    onPress={() => setDifficulty(d.value)}
                    className={`flex-1 items-center rounded-[14px] border py-3 ${
                      difficulty === d.value ? 'border-brand bg-forest-panelAlt' : 'border-border bg-surface/60'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Dificultad ${d.label}`}
                  >
                    <Text
                      className={`font-sans-medium text-sm ${difficulty === d.value ? 'text-primary' : 'text-secondary'}`}
                    >
                      {d.label}
                    </Text>
                  </ScalePressable>
                ))}
              </View>

              {/* Tiempo y raciones en fila */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Clock3 size={12} color="#70806E" strokeWidth={2} />
                    <Text className="font-sans text-xs text-muted">Tiempo (min)</Text>
                  </View>
                  <Input
                    value={String(prepMinutes)}
                    onChangeText={updatePrepMinutes}
                    inputMode="numeric"
                    placeholder="15"
                    accessibilityLabel="Tiempo de preparación"
                  />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Users size={12} color="#70806E" strokeWidth={2} />
                    <Text className="font-sans text-xs text-muted">Raciones</Text>
                  </View>
                  <Input
                    value={String(servings)}
                    onChangeText={updateServings}
                    inputMode="numeric"
                    placeholder="1"
                    accessibilityLabel="Número de raciones"
                  />
                </View>
              </View>
            </View>
          </ScreenTransition>
        </>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Ingredientes
// ─────────────────────────────────────────────────────────────────────────────

function Step2Ingredients({
  items,
  setItems,
  foods,
  customTags,
  setCustomTags,
  tagDraft,
  setTagDraft,
  totalMacros,
  unresolvedIngredients,
}: {
  items: DishItem[];
  setItems: React.Dispatch<React.SetStateAction<DishItem[]>>;
  foods: Food[];
  customTags: string[];
  setCustomTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagDraft: string;
  setTagDraft: (v: string) => void;
  totalMacros: MacroNutrients;
  unresolvedIngredients: string[];
}) {
  const router = useRouter();
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);

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

  const availableFoods = foods.filter((f) => !items.some((i) => i.food.id === f.id));
  const filteredFoods = useMemo(() => {
    const query = foodSearch.trim().toLowerCase();
    if (!query) return availableFoods;
    return availableFoods.filter((f) => f.name.toLowerCase().includes(query));
  }, [availableFoods, foodSearch]);

  function addFood(food: Food) {
    setItems((prev) => [...prev, { food, quantity: getFoodDefaultServingAmount(food) }]);
    setShowFoodPicker(false);
    setFoodSearch('');
  }

  function removeFood(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, qty: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Number(qty) || 0 } : item))
    );
  }

  function addCustomTag() {
    const normalizedTag = tagDraft.trim();
    if (!normalizedTag) return;
    setCustomTags((currentTags) => {
      if (currentTags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) return currentTags;
      return [...currentTags, normalizedTag];
    });
    setTagDraft('');
  }

  function removeCustomTag(tagToRemove: string) {
    setCustomTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTransition className="px-5 pt-4">
        {/* ── Alerta ingredientes sin resolver ── */}
        {unresolvedIngredients.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(160)}
            exiting={FadeOut.duration(120)}
            className="mb-4 rounded-[20px] border border-brand/30 bg-brand/8 px-4 py-4"
          >
            <Text className="font-sans-medium text-sm text-primary">Ingredientes sin resolver</Text>
            <Text className="mt-1.5 font-sans text-sm leading-6 text-secondary">
              Crea estos alimentos antes de guardar: {unresolvedIngredients.join(', ')}.
            </Text>
            <Button variant="outline" className="mt-3" onPress={() => router.push('/food/add')}>
              <UIText>Añadir alimento base</UIText>
            </Button>
          </Animated.View>
        )}

        {/* ── Header ingredientes ── */}
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Ingredientes</Text>
          {items.length > 0 && (
            <Animated.View style={badgeStyle} className="rounded-full bg-forest-panelAlt px-2.5 py-1">
              <Text className="font-mono text-[10px] tabular-nums text-brand">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* ── Lista ingredientes ── */}
        {items.length === 0 && !showFoodPicker ? (
          <Animated.View
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(100)}
            className="mt-3 items-center rounded-[20px] border border-dashed border-border py-8"
          >
            <Text className="font-sans text-sm text-muted">Sin ingredientes todavía</Text>
            <Text className="mt-1 font-sans text-xs text-muted">Pulsa el botón para añadir</Text>
          </Animated.View>
        ) : (
          <Animated.View layout={LinearTransition.duration(160)} className="mt-3 gap-2.5">
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
                  <View className="h-px bg-forest-line" />
                  <View className="flex-row items-center gap-3 px-4 py-4">
                    <View className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-panelAlt">
                      <Text className="font-mono text-[11px] text-secondary">{index + 1}</Text>
                    </View>
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
                    <ScrubInput
                      value={item.quantity}
                      onChange={(v) => updateQuantity(index, String(v))}
                      accessibilityLabel={`Cantidad para ${item.food.name}`}
                    />
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

        {/* ── Botón añadir ── */}
        {!showFoodPicker && (
          <AddIngredientButton onPress={() => { setFoodSearch(''); setShowFoodPicker(true); }} />
        )}

        {/* ── Food picker ── */}
        {showFoodPicker && (
          <Animated.View
            entering={FadeInDown.duration(160)}
            exiting={FadeOutUp.duration(120)}
            className="mt-3 overflow-hidden rounded-[20px] border border-brand/40 bg-forest-panelAlt"
          >
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-brand/15">
                  <Plus size={11} color="#EC5B13" strokeWidth={2.5} />
                </View>
                <Text className="font-sans text-[11px] tracking-widest uppercase text-secondary">
                  Elegir alimento
                </Text>
                {availableFoods.length > 0 && (
                  <View className="rounded-full bg-surface px-2 py-0.5">
                    <Text className="font-mono text-[10px] tabular-nums text-muted">
                      {filteredFoods.length}{foodSearch.trim() ? `/${availableFoods.length}` : ''}
                    </Text>
                  </View>
                )}
              </View>
              <ScalePressable
                onPress={() => { setShowFoodPicker(false); setFoodSearch(''); }}
                className="h-7 w-7 items-center justify-center rounded-full bg-surface"
                accessibilityRole="button"
                accessibilityLabel="Cancelar selección"
                hitSlop={8}
              >
                <X size={13} color="#A9B8A8" strokeWidth={2} />
              </ScalePressable>
            </View>

            <View className="border-b border-border px-4 py-2.5">
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
                    <Pressable onPress={() => setFoodSearch('')} hitSlop={6}>
                      <X size={12} color="#70806E" strokeWidth={2} />
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            </View>

            {filteredFoods.length === 0 ? (
              <View className="items-center px-4 py-8">
                {availableFoods.length === 0 ? (
                  <Text className="font-sans text-sm text-muted">Todos los alimentos añadidos</Text>
                ) : (
                  <>
                    <Text className="font-sans text-sm text-muted">Sin resultados para</Text>
                    <Text className="mt-0.5 font-sans-medium text-sm text-secondary">"{foodSearch}"</Text>
                  </>
                )}
              </View>
            ) : (
              filteredFoods.map((food, index) => {
                const defaultMacros = calculateFoodServingMacros(food, getFoodDefaultServingAmount(food));
                return (
                  <Animated.View key={food.id} entering={FadeIn.duration(120).delay(index * 20)}>
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

        {/* ── Total nutricional ── */}
        {items.length > 0 && (
          <>
            <Separator className="my-5" />
            <Animated.View entering={FadeInDown.duration(160)}>
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">TOTAL NUTRICIONAL</Text>
              <View className="mt-4 border-b border-border pb-4">
                <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorías estimadas</Text>
                <Text className="mt-2 font-sans-bold text-[38px] text-primary">{Math.round(totalMacros.calories)}</Text>
                <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-brand">kcal de la receta</Text>
              </View>
              <NutritionGrid macros={totalMacros} size="sm" className="mt-3" />
            </Animated.View>
          </>
        )}

        {/* ── Tags personalizadas ── */}
        <Separator className="my-5" />
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Tags</Text>
          <Text className="font-sans text-xs text-muted">Opcional</Text>
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          <Input
            value={tagDraft}
            onChangeText={setTagDraft}
            placeholder="Ej. postentreno, tupper"
            className="flex-1"
            accessibilityLabel="Nueva tag personalizada"
            onSubmitEditing={addCustomTag}
          />
          <Button variant="outline" onPress={addCustomTag} accessibilityLabel="Añadir tag">
            <UIText>Añadir</UIText>
          </Button>
        </View>
        {customTags.length > 0 && (
          <Animated.View layout={LinearTransition.duration(140)} className="mt-4 flex-row flex-wrap gap-2">
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
        )}
      </ScreenTransition>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Pasos de preparación
// ─────────────────────────────────────────────────────────────────────────────

function splitPreparationIntoSteps(text: string) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function canNavigateToWizardStep({
  targetStep,
  step1Valid,
  step2Valid,
}: {
  targetStep: number;
  step1Valid: boolean;
  step2Valid: boolean;
}) {
  if (targetStep <= 1) return true;
  if (targetStep === 2) return step1Valid;
  return step1Valid && step2Valid;
}

function Step3Steps({
  preparationText,
  setPreparationText,
}: {
  preparationText: string;
  setPreparationText: (value: string) => void;
}) {
  const organizedPreview = splitPreparationIntoSteps(preparationText);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTransition className="px-5 pt-5">
        <View className="mb-1 flex-row items-center justify-between gap-3">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            Elaboración
          </Text>
          <Button
            variant="outline"
            onPress={() => Alert.alert('Organizar', 'Aquí enviaremos la elaboración a un LLM para limpiarla, ordenarla y mejorar el texto.')}
            accessibilityLabel="Organizar elaboración"
            className="h-10 px-4"
          >
            <Sparkles size={14} color="#A9B8A8" strokeWidth={2} />
            <UIText>Organizar</UIText>
          </Button>
        </View>

        <Text className="font-sans text-xs leading-5 text-muted mb-4">
          Escribe toda la receta del tirón. Luego la presentaremos como pasos para leerla mejor.
        </Text>

        <View className="overflow-hidden rounded-[24px] border border-border bg-surface/90 px-4 py-4">
          <TextInput
            value={preparationText}
            onChangeText={setPreparationText}
            placeholder="Escribe aquí la receta completa. Puedes separar bloques con líneas en blanco para que luego se presenten como pasos."
            placeholderTextColor="#4A5A49"
            multiline
            textAlignVertical="top"
            className="font-sans text-sm leading-6 text-primary"
            style={{ minHeight: 240 }}
            accessibilityLabel="Elaboración completa"
          />
        </View>

        <Animated.View entering={FadeIn.duration(180)} className="mt-4 rounded-[18px] bg-forest-panelAlt px-4 py-3">
          <Text className="font-sans text-xs leading-5 text-muted">
            Telegram vibes: escribe libre, separa con saltos de línea y luego lo presentaremos como {organizedPreview.length > 0 ? `${organizedPreview.length} bloque${organizedPreview.length === 1 ? '' : 's'}` : 'pasos claros'} en la vista final.
          </Text>
        </Animated.View>
      </ScreenTransition>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateFavoriteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: foods = [] } = useFoodsQuery('');
  const createFavoriteMutation = useCreateFavoriteMutation();
  const createMealLogEntryMutation = useCreateMealLogEntryMutation();
  const aiRecipeDraft = queryClient.getQueryData<AiRecipeDraft>(aiQueryKeys.selectedRecipeDraft());

  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<StepDirection>('forward');

  // Step 1 state
  const [mode, setMode] = useState<CreationMode>('manual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [prepMinutes, setPrepMinutes] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('Facil');
  const [servings, setServings] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Step 2 state
  const [items, setItems] = useState<DishItem[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  // Step 3 state
  const [preparationText, setPreparationText] = useState('');

  const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(null);

  // Hydrate AI draft on mount
  useEffect(() => {
    if (!aiRecipeDraft) { setHydratedDraftId(null); return; }
    if (hydratedDraftId === aiRecipeDraft.draftId) return;
    setMode('manual');
    setName(aiRecipeDraft.title);
    setItems(resolveDraftItems(aiRecipeDraft, foods));
    setCustomTags(aiRecipeDraft.tags.filter((tag) => tag !== 'Sugerida por AI' && tag !== aiRecipeDraft.modeLabel));
    setPreparationText((aiRecipeDraft.steps ?? []).join('\n\n'));
    setDescription(aiRecipeDraft.description ?? '');
    setHydratedDraftId(aiRecipeDraft.draftId);
  }, [aiRecipeDraft, foods, hydratedDraftId]);

  const totalMacros: MacroNutrients = useMemo(() => {
    const macrosList = items.map((item) => calculateFoodServingMacros(item.food, item.quantity));
    return sumMacros(macrosList);
  }, [items]);

  const unresolvedIngredients = useMemo(() => {
    if (!aiRecipeDraft) return [];
    return aiRecipeDraft.items
      .filter((item) => !foods.some((food) => food.id === item.foodId))
      .map((item) => item.foodId);
  }, [aiRecipeDraft, foods]);

  // Validation per step
  const step1Valid = mode !== 'manual' || name.trim().length > 0;
  const step2Valid = items.length > 0 && unresolvedIngredients.length === 0;
  const step3Valid = preparationText.trim().length > 0;
  const canSave = step1Valid && step2Valid && step3Valid;

  function handleDiscardDraft() {
    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });
    setHydratedDraftId(null);
    setName('');
    setItems([]);
    setCustomTags([]);
    setTagDraft('');
    setPreparationText('');
    setDescription('');
    setImageUri('');
  }

  async function handleSave() {
    const baseTags = aiRecipeDraft ? aiRecipeDraft.tags : ['Manual'];
    const tags = Array.from(new Set([...baseTags, ...customTags]));
    const finalSteps = splitPreparationIntoSteps(preparationText);
    const fallbackImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80';

    const createdDish = await createFavoriteMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || 'Receta personalizada guardada en el recetario.',
      imageUri: imageUri || fallbackImage,
      prepMinutes,
      difficulty,
      servings,
      tags,
      steps: finalSteps.length > 0 ? finalSteps : ['Monta la receta con tus ingredientes guardados.'],
      items: items.map((item) => ({ foodId: item.food.id, quantity: item.quantity })),
    });

    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });

    // Navigate to the newly created dish — no Alert
    router.replace({ pathname: '/favorite/[id]', params: { id: createdDish.id, justCreated: '1' } });
  }

  async function handleSaveAndLog() {
    const baseTags = aiRecipeDraft ? aiRecipeDraft.tags : ['Manual'];
    const tags = Array.from(new Set([...baseTags, ...customTags]));
    const finalSteps = splitPreparationIntoSteps(preparationText);
    const fallbackImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80';

    const createdDish = await createFavoriteMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || 'Receta personalizada guardada en el recetario.',
      imageUri: imageUri || fallbackImage,
      prepMinutes,
      difficulty,
      servings,
      tags,
      steps: finalSteps.length > 0 ? finalSteps : ['Monta la receta con tus ingredientes guardados.'],
      items: items.map((item) => ({ foodId: item.food.id, quantity: item.quantity })),
    });

    queryClient.removeQueries({ queryKey: aiQueryKeys.selectedRecipeDraft() });

    await createMealLogEntryMutation.mutateAsync({
      source: 'favorite',
      total: totalMacros,
      favoriteDishId: createdDish.id,
      notes: createdDish.name,
    });

    router.replace('/(tabs)');
  }

  const isLoading = createFavoriteMutation.isPending || createMealLogEntryMutation.isPending;

  const canGoToStep = (step: number) =>
    canNavigateToWizardStep({
      targetStep: step,
      step1Valid,
      step2Valid,
    });

  function goToStep(step: number) {
    if (!canGoToStep(step)) return;
    setStepDirection(step > currentStep ? 'forward' : 'backward');
    setCurrentStep(step);
  }

  function goNext() {
    if (currentStep < 3 && canGoToStep(currentStep + 1)) {
      setStepDirection('forward');
      setCurrentStep((s) => s + 1);
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setStepDirection('backward');
      setCurrentStep((s) => s - 1);
      return;
    }

    router.back();
  }

  const stepNextEnabled = currentStep === 1 ? step1Valid : currentStep === 2 ? step2Valid : step3Valid;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* ── Header ── */}
      <View className="z-20 flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={goBack}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel={currentStep > 1 ? 'Paso anterior' : 'Volver atrás'}
        >
          <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">NUEVA RECETA</Text>
        </View>
        {/* Step counter */}
        <View className="rounded-full bg-forest-panelAlt px-3 py-1">
          <Text className="font-mono text-[11px] tabular-nums text-brand">{currentStep}/3</Text>
        </View>
      </View>

      {/* ── Step progress bar ── */}
      <View className="z-20 border-b border-border bg-surface shadow-black/10">
        <StepProgressBar currentStep={currentStep} canGoToStep={canGoToStep} onStepPress={goToStep} />
      </View>

      {/* ── Step content ── */}
      <View className="flex-1 overflow-hidden bg-canvas">
        <Animated.View
          key={`step-${currentStep}`}
          entering={
            stepDirection === 'forward'
              ? SlideInRight.duration(220).easing(Easing.out(Easing.cubic))
              : SlideInLeft.duration(220).easing(Easing.out(Easing.cubic))
          }
          exiting={
            stepDirection === 'forward'
              ? SlideOutLeft.duration(180).easing(Easing.in(Easing.cubic))
              : SlideOutRight.duration(180).easing(Easing.in(Easing.cubic))
          }
          className="flex-1"
        >
        {currentStep === 1 && (
          <Step1Info
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            imageUri={imageUri}
            setImageUri={setImageUri}
            prepMinutes={prepMinutes}
            setPrepMinutes={setPrepMinutes}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            servings={servings}
            setServings={setServings}
            mode={mode}
            setMode={setMode}
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            aiRecipeDraft={aiRecipeDraft}
            foods={foods}
            hydratedDraftId={hydratedDraftId}
            setHydratedDraftId={setHydratedDraftId}
            unresolvedIngredients={unresolvedIngredients}
            onDiscardDraft={handleDiscardDraft}
          />
        )}
        {currentStep === 2 && (
          <Step2Ingredients
            items={items}
            setItems={setItems}
            foods={foods}
            customTags={customTags}
            setCustomTags={setCustomTags}
            tagDraft={tagDraft}
            setTagDraft={setTagDraft}
            totalMacros={totalMacros}
            unresolvedIngredients={unresolvedIngredients}
          />
        )}
        {currentStep === 3 && (
          <Step3Steps
            preparationText={preparationText}
            setPreparationText={setPreparationText}
          />
        )}
        </Animated.View>
      </View>

      {/* ── Bottom bar ── */}
      <View className="border-t border-border bg-surface px-5 pb-8 pt-4">
        {currentStep < 3 ? (
          <Button
            onPress={goNext}
            disabled={!stepNextEnabled}
            accessibilityLabel={`Ir al paso ${currentStep + 1}`}
            className="h-12"
          >
            <UIText>Siguiente</UIText>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </Button>
        ) : (
          <View className="gap-3">
            <Button
              onPress={() => void handleSaveAndLog()}
              disabled={!canSave || isLoading}
              accessibilityLabel="Guardar y registrar hoy"
              className="h-12"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Check size={16} color="#FFFFFF" strokeWidth={2} />
              )}
              <UIText>{isLoading ? 'Guardando…' : 'Guardar y registrar hoy'}</UIText>
            </Button>

            <Button
              variant="outline"
              onPress={() => void handleSave()}
              disabled={!canSave || isLoading}
              accessibilityLabel="Solo guardar"
              className="h-12"
            >
              <UIText>Solo guardar</UIText>
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
