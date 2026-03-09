import { useState, useMemo } from 'react';
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
import { calculatePerServing } from '@/utils/calculatePerServing';
import type { MacroNutrients } from '@/types/nutrition';

type ServingUnit = 'g' | 'ml' | 'unit';

const UNITS: { value: ServingUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'unit', label: 'unit' },
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

  const canSave =
    name.trim().length > 0 &&
    Number(calories) > 0 &&
    Number(servingSize) > 0;

  function handleSave() {
    // TODO: persist to DynamoDB via API
    Alert.alert('Food Saved', `${name} has been added to your catalog.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          ADD FOOD
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name field */}
        <View className="px-5 pt-5">
          <Label nativeID="food-name">Food Name</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chicken Breast"
            className="mt-1.5"
            autoFocus
            accessibilityLabelledBy="food-name"
            accessibilityLabel="Food name"
          />
        </View>

        {/* Serving size + unit */}
        <View className="mt-4 flex-row gap-3 px-5">
          <View className="flex-1">
            <Label nativeID="serving-size">Default Serving</Label>
            <Input
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="100"
              className="mt-1.5"
              inputMode="decimal"
              accessibilityLabelledBy="serving-size"
              accessibilityLabel="Default serving size"
            />
          </View>
          <View className="w-24">
            <Label nativeID="serving-unit">Unit</Label>
            <View className="mt-1.5 flex-row">
              {UNITS.map((u) => (
                <Pressable
                  key={u.value}
                  onPress={() => setServingUnit(u.value)}
                  className={`flex-1 items-center border py-2.5 ${
                    servingUnit === u.value
                      ? 'border-primary bg-primary'
                      : 'border-border bg-surface'
                  } ${u.value === 'g' ? 'rounded-l-sm' : ''} ${
                    u.value === 'unit' ? 'rounded-r-sm' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Unit: ${u.label}`}
                  accessibilityState={{ selected: servingUnit === u.value }}
                >
                  <Text
                    className={`font-mono text-xs ${
                      servingUnit === u.value ? 'text-surface' : 'text-secondary'
                    }`}
                  >
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Separator className="mx-5 my-5" />

        {/* Macros per 100g */}
        <View className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            MACROS PER 100{servingUnit}
          </Text>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-cal">Calories</Label>
              <Input
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                className="mt-1.5 border-accent-green/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-cal"
                accessibilityLabel="Calories per 100 grams"
              />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-pro">Protein</Label>
              <Input
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                className="mt-1.5 border-accent-blue/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-pro"
                accessibilityLabel="Protein per 100 grams"
              />
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Label nativeID="macro-carb">Carbs</Label>
              <Input
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                className="mt-1.5 border-accent-amber/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-carb"
                accessibilityLabel="Carbs per 100 grams"
              />
            </View>
            <View className="flex-1">
              <Label nativeID="macro-fat">Fats</Label>
              <Input
                value={fats}
                onChangeText={setFats}
                placeholder="0"
                className="mt-1.5 border-accent-red/30"
                inputMode="decimal"
                accessibilityLabelledBy="macro-fat"
                accessibilityLabel="Fats per 100 grams"
              />
            </View>
          </View>
        </View>

        {/* Live preview */}
        {canSave && (
          <>
            <Separator className="mx-5 my-5" />
            <View className="px-5">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                PREVIEW — {servingSize}
                {servingUnit} SERVING
              </Text>
              <NutritionGrid macros={preview} size="sm" className="mt-3" />
            </View>
          </>
        )}
      </ScrollView>

      {/* Save button */}
      <View className="border-t border-border bg-surface px-5 py-4">
        <Button
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel="Save Food"
        >
          <UIText>Save Food</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
