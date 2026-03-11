import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { NutritionGrid } from '@/components/NutritionGrid';
import { ScreenTransition } from '@/components/ScreenTransition';
import { calculatePerServing } from '@/utils/calculatePerServing';
import type { MacroNutrients } from '@/types/nutrition';

type ServingUnit = 'g' | 'ml' | 'unit';

const UNITS: { value: ServingUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'unit', label: 'ud' },
];

export default function AddFoodScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState<ServingUnit>('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const per100g: MacroNutrients = useMemo(
    () => ({
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
    }),
    [calories, protein, carbs, fats]
  );

  const preview = useMemo(
    () => calculatePerServing(per100g, Number(servingSize) || 0),
    [per100g, servingSize]
  );

  const canSave = name.trim().length > 0 && Number(calories) > 0 && Number(servingSize) > 0;

  function handleSave() {
    Alert.alert('Alimento guardado', `${name} se ha anadido a tu catalogo.`, [
      { text: 'Vale', onPress: () => router.back() },
    ]);
  }

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
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          ANADIR ALIMENTO
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTransition variant="right" className="px-5 pt-5">
          <Label nativeID="food-name">Nombre del alimento</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Ej. pechuga de pollo"
            className="mt-1.5"
            autoFocus
            accessibilityLabelledBy="food-name"
            accessibilityLabel="Nombre del alimento"
          />
        </ScreenTransition>

        <ScreenTransition variant="right" delay={40} className="mt-4 flex-row gap-3 px-5">
          <View className="flex-1">
            <Label nativeID="serving-size">Racion por defecto</Label>
            <Input
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="100"
              className="mt-1.5"
              inputMode="decimal"
              accessibilityLabelledBy="serving-size"
              accessibilityLabel="Tamano de la racion por defecto"
            />
          </View>
          <View className="w-24">
            <Label nativeID="serving-unit">Unidad</Label>
            <View className="mt-1.5 flex-row">
              {UNITS.map((u) => (
                <Pressable
                  key={u.value}
                  onPress={() => setServingUnit(u.value)}
                  className={`flex-1 items-center border py-2.5 ${
                    servingUnit === u.value ? 'border-brand bg-brand' : 'border-border bg-surface'
                  } ${u.value === 'g' ? 'rounded-l-sm' : ''} ${u.value === 'unit' ? 'rounded-r-sm' : ''}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Unidad: ${u.label}`}
                  accessibilityState={{ selected: servingUnit === u.value }}
                >
                  <Text className={`font-mono text-xs ${servingUnit === u.value ? 'text-white' : 'text-secondary'}`}>
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScreenTransition>

        <Separator className="mx-5 my-5" />

        <ScreenTransition variant="right" delay={80} className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            MACROS POR 100{servingUnit}
          </Text>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-cal">Calorias</Label>
              <Input
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                className="mt-1.5 border-brand/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-cal"
                accessibilityLabel="Calorias por 100 gramos"
              />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-pro">Proteina</Label>
              <Input
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                className="mt-1.5 border-protein/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-pro"
                accessibilityLabel="Proteina por 100 gramos"
              />
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-carb">Carbohidratos</Label>
              <Input
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                className="mt-1.5 border-carbs/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-carb"
                accessibilityLabel="Carbohidratos por 100 gramos"
              />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-fat">Grasas</Label>
              <Input
                value={fats}
                onChangeText={setFats}
                placeholder="0"
                className="mt-1.5 border-fat/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-fat"
                accessibilityLabel="Grasas por 100 gramos"
              />
            </View>
          </View>
        </ScreenTransition>

        {canSave && (
          <>
            <Separator className="mx-5 my-5" />
            <ScreenTransition variant="right" delay={120} className="px-5">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                VISTA PREVIA - RACION DE {servingSize}
                {servingUnit}
              </Text>
              <NutritionGrid macros={preview} size="sm" className="mt-3" />
            </ScreenTransition>
          </>
        )}
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button onPress={handleSave} disabled={!canSave} accessibilityLabel="Guardar alimento">
          <UIText>Guardar alimento</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
