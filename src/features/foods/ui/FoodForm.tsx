import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { SUPERMARKETS } from '@/constants/supermarkets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NutritionGrid } from '@/components/NutritionGrid';
import { ScreenTransition } from '@/components/ScreenTransition';
import { Text as UIText } from '@/components/ui/text';
import { withForm } from '@/features/foods/ui/form';
import { calculateServingMacros } from '@/utils/calculatePerServing';
import type { Supermarket } from '@/types/nutrition';
import { useStore } from '@tanstack/react-form';

const FOOD_REFERENCE_AMOUNT = 100;

export type FoodFormValues = {
  name: string;
  referenceAmount: number;
  referenceMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  defaultServingAmount: number | undefined;
  supermarket: Supermarket | null;
};

type FoodFormProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  showPerServingPreview: boolean;
};

const toNumber = (value: string) => {
  const normalized = value.replace(',', '.').trim();

  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toOptionalNumber = (value: string) => {
  const normalized = value.replace(',', '.').trim();

  if (normalized.length === 0) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const FoodForm = withForm({
  defaultValues: {} as FoodFormValues,
  props: {
    title: '',
    subtitle: '',
    ctaLabel: '',
    showPerServingPreview: true,
  } as FoodFormProps,
  render: function Render({ form, title, subtitle, ctaLabel, showPerServingPreview }) {

    const { defaultServingAmount } = useStore(form.store, (state) => state.values);

    return (
      <>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenTransition variant="right" className="px-5 pt-5">
            <Text className="font-sans text-sm text-secondary">{subtitle}</Text>
            <Text className="mt-1 font-sans-bold text-[30px] leading-[34px] text-primary">{title}</Text>

            <View className="mt-6">
              <Label nativeID="food-name">Nombre del alimento</Label>
              <form.Field name="name">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Ej. pechuga de pollo"
                    className="mt-1.5"
                    accessibilityLabelledBy="food-name"
                    accessibilityLabel="Nombre del alimento"
                  />
                )}
              </form.Field>
            </View>
          </ScreenTransition>

          <ScreenTransition variant="right" delay={30} className="mt-8 px-5">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Label nativeID="serving-size">Racion por defecto</Label>
                  <Text className="font-sans text-xs text-secondary">Opcional</Text>
                </View>
                <View className="mt-1.5 flex-row items-center gap-3">
                  <form.Field name="defaultServingAmount">
                    {(field) => (
                      <Input
                        value={field.state.value ? String(field.state.value) : ''}
                        onChangeText={(value) => field.handleChange(toOptionalNumber(value))}
                        placeholder="Ej. 150"
                        className="flex-1"
                        inputMode="decimal"
                        accessibilityLabelledBy="serving-size"
                        accessibilityLabel="Tamano de la racion por defecto en gramos"
                      />
                    )}
                  </form.Field>
                  <View className="rounded-full bg-forest-panelAlt px-4 py-3">
                    <Text className="font-sans-medium text-sm text-primary">g</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScreenTransition>

          <ScreenTransition variant="right" delay={60} className="mt-8 px-5">
            <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Macros de referencia</Text>
            <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
              Introduce el valor exacto para {defaultServingAmount} g y manten una referencia consistente cuando este alimento se reutilice en recetas y registros.
            </Text>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Label nativeID="macro-cal">Calorias</Label>
                <form.Field name="referenceMacros.calories">
                  {(field) => (
                    <Input
                      value={field.state.value === 0 ? '' : String(field.state.value)}
                      onChangeText={(value) => field.handleChange(toNumber(value))}
                      placeholder="0"
                      className="mt-1.5"
                      inputMode="decimal"
                      accessibilityLabelledBy="macro-cal"
                      accessibilityLabel={`Calorias por ${FOOD_REFERENCE_AMOUNT} gramos`}
                    />
                  )}
                </form.Field>
              </View>
              <View className="flex-1">
                <Label nativeID="macro-pro">Proteina</Label>
                <form.Field name="referenceMacros.protein">
                  {(field) => (
                    <Input
                      value={field.state.value === 0 ? '' : String(field.state.value)}
                      onChangeText={(value) => field.handleChange(toNumber(value))}
                      placeholder="0"
                      className="mt-1.5"
                      inputMode="decimal"
                      accessibilityLabelledBy="macro-pro"
                      accessibilityLabel={`Proteina por ${FOOD_REFERENCE_AMOUNT} gramos`}
                    />
                  )}
                </form.Field>
              </View>
            </View>

            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Label nativeID="macro-carb">Carbohidratos</Label>
                <form.Field name="referenceMacros.carbs">
                  {(field) => (
                    <Input
                      value={field.state.value === 0 ? '' : String(field.state.value)}
                      onChangeText={(value) => field.handleChange(toNumber(value))}
                      placeholder="0"
                      className="mt-1.5"
                      inputMode="decimal"
                      accessibilityLabelledBy="macro-carb"
                      accessibilityLabel={`Carbohidratos por ${FOOD_REFERENCE_AMOUNT} gramos`}
                    />
                  )}
                </form.Field>
              </View>
              <View className="flex-1">
                <Label nativeID="macro-fat">Grasas</Label>
                <form.Field name="referenceMacros.fats">
                  {(field) => (
                    <Input
                      value={field.state.value === 0 ? '' : String(field.state.value)}
                      onChangeText={(value) => field.handleChange(toNumber(value))}
                      placeholder="0"
                      className="mt-1.5"
                      inputMode="decimal"
                      accessibilityLabelledBy="macro-fat"
                      accessibilityLabel={`Grasas por ${FOOD_REFERENCE_AMOUNT} gramos`}
                    />
                  )}
                </form.Field>
              </View>
            </View>
          </ScreenTransition>

          <ScreenTransition variant="right" delay={75} className="mt-8 px-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Supermercado habitual</Text>
              <Text className="font-sans text-xs text-secondary">Opcional</Text>
            </View>

            <form.Field name="supermarket">
              {(field) => (
                <View className="mt-4 flex-row flex-wrap gap-3">
                  {SUPERMARKETS.map((store) => {
                    const isActive = field.state.value === store.id;

                    return (
                      <Pressable
                        key={store.id}
                        onPress={() => field.handleChange(field.state.value === store.id ? null : store.id)}
                        className={`min-w-[31%] flex-1 rounded-[24px] px-3 py-3 ${isActive ? 'bg-forest-panelAlt' : 'bg-surface'}`}
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
              )}
            </form.Field>
          </ScreenTransition>

          {showPerServingPreview ? (
            <form.Subscribe>
              {(state) => {
                const values = state.values as FoodFormValues;
                const resolvedDefaultServingAmount = values.defaultServingAmount || FOOD_REFERENCE_AMOUNT;
                const preview = calculateServingMacros(
                  values.referenceMacros,
                  FOOD_REFERENCE_AMOUNT,
                  resolvedDefaultServingAmount
                );

                return (
                  <ScreenTransition variant="right" delay={90} className="mt-8 px-5">
                    <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                      Vista previa - racion de {resolvedDefaultServingAmount}g
                    </Text>
                    <View className="mt-4 border-b border-border pb-4">
                      <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorias estimadas</Text>
                      <Text className="mt-2 font-sans-bold text-[38px] text-primary">{Math.round(preview.calories)}</Text>
                      <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-secondary">kcal por racion</Text>
                    </View>
                    <NutritionGrid macros={preview} size="sm" className="mt-4" />
                  </ScreenTransition>
                );
              }}
            </form.Subscribe>
          ) : null}
        </ScrollView>

        <form.Subscribe>
          {(state) => {
            const values = state.values as FoodFormValues;
            const canSave = values.name.trim().length > 0 && values.referenceMacros.calories > 0;

            return (
              <View className="border-t border-border bg-surface px-5 py-4">
                <Button onPress={() => void form.handleSubmit()} disabled={!canSave} accessibilityLabel={ctaLabel}>
                  <Check size={16} color="#FFFFFF" strokeWidth={2} />
                  <UIText>{ctaLabel}</UIText>
                </Button>
              </View>
            );
          }}
        </form.Subscribe>
      </>
    );
  },
});
