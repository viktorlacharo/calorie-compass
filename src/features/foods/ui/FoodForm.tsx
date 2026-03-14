import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { SUPERMARKETS } from '@/constants/supermarkets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NutritionGrid } from '@/components/NutritionGrid';
import { ScreenTransition } from '@/components/ScreenTransition';
import { Text as UIText } from '@/components/ui/text';
import type { MacroNutrients, Supermarket } from '@/types/nutrition';

type FoodFormValues = {
  name: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  supermarket: Supermarket | null;
};

type FoodFormProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  values: FoodFormValues;
  per100g: MacroNutrients;
  preview: MacroNutrients;
  canSave: boolean;
  showPerServingPreview?: boolean;
  onChange: (field: keyof FoodFormValues, value: string | Supermarket | null) => void;
  onSubmit: () => void;
};

export function FoodForm({
  title,
  subtitle,
  ctaLabel,
  values,
  per100g,
  preview,
  canSave,
  showPerServingPreview = true,
  onChange,
  onSubmit,
}: FoodFormProps) {
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
            <Input
              value={values.name}
              onChangeText={(value) => onChange('name', value)}
              placeholder="Ej. pechuga de pollo"
              className="mt-1.5"
              autoFocus
              accessibilityLabelledBy="food-name"
              accessibilityLabel="Nombre del alimento"
            />
          </View>
        </ScreenTransition>

        <ScreenTransition variant="right" delay={30} className="mt-8 px-5">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Label nativeID="serving-size">Racion por defecto</Label>
              <View className="mt-1.5 flex-row items-center gap-3">
                <Input
                  value={values.servingSize}
                  onChangeText={(value) => onChange('servingSize', value)}
                  placeholder="100"
                  className="flex-1"
                  inputMode="decimal"
                  accessibilityLabelledBy="serving-size"
                  accessibilityLabel="Tamano de la racion por defecto en gramos"
                />
                <View className="rounded-full bg-forest-panelAlt px-4 py-3">
                  <Text className="font-sans-medium text-sm text-primary">g</Text>
                </View>
              </View>
            </View>
          </View>

        </ScreenTransition>

        <ScreenTransition variant="right" delay={60} className="mt-8 px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">Macros por 100g</Text>
          <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
            Introduce el valor exacto por 100g para mantener consistencia cuando este alimento se reutilice en recetas y registros.
          </Text>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-cal">Calorias</Label>
              <Input value={values.calories} onChangeText={(value) => onChange('calories', value)} placeholder="0" className="mt-1.5" inputMode="decimal" accessibilityLabelledBy="macro-cal" accessibilityLabel="Calorias por 100 gramos" />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-pro">Proteina</Label>
              <Input value={values.protein} onChangeText={(value) => onChange('protein', value)} placeholder="0" className="mt-1.5" inputMode="decimal" accessibilityLabelledBy="macro-pro" accessibilityLabel="Proteina por 100 gramos" />
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-carb">Carbohidratos</Label>
              <Input value={values.carbs} onChangeText={(value) => onChange('carbs', value)} placeholder="0" className="mt-1.5" inputMode="decimal" accessibilityLabelledBy="macro-carb" accessibilityLabel="Carbohidratos por 100 gramos" />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-fat">Grasas</Label>
              <Input value={values.fats} onChangeText={(value) => onChange('fats', value)} placeholder="0" className="mt-1.5" inputMode="decimal" accessibilityLabelledBy="macro-fat" accessibilityLabel="Grasas por 100 gramos" />
            </View>
          </View>

        </ScreenTransition>

        <ScreenTransition variant="right" delay={75} className="mt-8 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Supermercado habitual</Text>
            <Text className="font-sans text-xs text-secondary">Opcional</Text>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-3">
            {SUPERMARKETS.map((store) => {
              const isActive = values.supermarket === store.id;

              return (
                <Pressable
                  key={store.id}
                  onPress={() => onChange('supermarket', values.supermarket === store.id ? null : store.id)}
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
        </ScreenTransition>

        {showPerServingPreview ? (
          <ScreenTransition variant="right" delay={90} className="mt-8 px-5">
            <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
              Vista previa - racion de {values.servingSize || '0'}g
            </Text>
            <View className="mt-4 border-b border-border pb-4">
              <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">Calorias estimadas</Text>
              <Text className="mt-2 font-sans-bold text-[38px] text-primary">{Math.round(preview.calories)}</Text>
              <Text className="font-sans text-[11px] uppercase tracking-[1.3px] text-secondary">kcal por racion</Text>
            </View>
            <NutritionGrid macros={preview} size="sm" className="mt-4" />
          </ScreenTransition>
        ) : null}
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button onPress={onSubmit} disabled={!canSave} accessibilityLabel={ctaLabel}>
          <Check size={16} color="#FFFFFF" strokeWidth={2} />
          <UIText>{ctaLabel}</UIText>
        </Button>
      </View>
    </>
  );
}
