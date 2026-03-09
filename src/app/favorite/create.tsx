import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Minus, Check } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { NutritionGrid } from '@/components/NutritionGrid';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import { mockFoods } from '@/mocks/nutrition';
import type { MacroNutrients, Food } from '@/types/nutrition';

type DishItem = {
  food: Food;
  quantity: number;
};

export default function CreateFavoriteScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [items, setItems] = useState<DishItem[]>([]);
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const totalMacros: MacroNutrients = useMemo(() => {
    const macrosList = items.map((item) =>
      calculatePerServing(item.food.per100g, item.quantity)
    );
    return sumMacros(macrosList);
  }, [items]);

  const canSave = name.trim().length > 0 && items.length > 0;

  function addFood(food: Food) {
    setItems((prev) => [...prev, { food, quantity: food.servingSize }]);
    setShowFoodPicker(false);
  }

  function removeFood(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, qty: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Number(qty) || 0 } : item
      )
    );
  }

  function handleSave() {
    // TODO: persist to DynamoDB
    Alert.alert(
      'Dish Created',
      `"${name}" has been saved with ${items.length} items.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  // Available foods not yet added
  const availableFoods = mockFoods.filter(
    (f) => !items.some((i) => i.food.id === f.id)
  );

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
          CREATE FAVORITE DISH
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dish name */}
        <View className="px-5 pt-5">
          <Label nativeID="dish-name">Dish Name</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lunch Bowl"
            className="mt-1.5"
            autoFocus
            accessibilityLabelledBy="dish-name"
            accessibilityLabel="Dish name"
          />
        </View>

        <Separator className="mx-5 my-4" />

        {/* Items list */}
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
              INGREDIENTS
            </Text>
            <Text className="font-mono text-[10px] tabular-nums text-muted">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {items.map((item, index) => (
            <View
              key={item.food.id}
              className="mt-3 flex-row items-center border border-border bg-surface p-3"
            >
              <View className="flex-1">
                <Text
                  className="font-sans-medium text-xs text-primary"
                  numberOfLines={1}
                >
                  {item.food.name}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-2">
                  <Input
                    value={String(item.quantity)}
                    onChangeText={(v) => updateQuantity(index, v)}
                    className="h-8 w-16 px-2 text-xs"
                    inputMode="decimal"
                    accessibilityLabel={`Quantity for ${item.food.name}`}
                  />
                  <Text className="font-mono text-[10px] text-muted">
                    {item.food.servingUnit}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => removeFood(index)}
                className="ml-2 h-8 w-8 items-center justify-center rounded-sm active:bg-canvas"
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.food.name}`}
              >
                <Minus size={14} color="#DC2626" strokeWidth={2} />
              </Pressable>
            </View>
          ))}

          {/* Add food button */}
          {!showFoodPicker && (
            <Pressable
              onPress={() => setShowFoodPicker(true)}
              className="mt-3 flex-row items-center justify-center gap-2 border border-dashed border-border py-3 active:bg-surface"
              accessibilityRole="button"
              accessibilityLabel="Add Ingredient"
            >
              <Plus size={14} color="#78716C" strokeWidth={2} />
              <Text className="font-sans-medium text-xs text-secondary">
                Add Ingredient
              </Text>
            </Pressable>
          )}

          {/* Inline food picker */}
          {showFoodPicker && (
            <View className="mt-3 border border-border bg-surface">
              <View className="flex-row items-center justify-between px-3 py-2">
                <Text className="font-sans text-[10px] tracking-widest uppercase text-muted">
                  SELECT A FOOD
                </Text>
                <Pressable
                  onPress={() => setShowFoodPicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel Selection"
                >
                  <Text className="font-sans-medium text-xs text-secondary">
                    Cancel
                  </Text>
                </Pressable>
              </View>
              {availableFoods.length === 0 ? (
                <View className="px-3 py-4">
                  <Text className="text-center font-sans text-xs text-muted">
                    All foods already added
                  </Text>
                </View>
              ) : (
                availableFoods.map((food) => (
                  <Pressable
                    key={food.id}
                    onPress={() => addFood(food)}
                    className="flex-row items-center justify-between border-t border-border px-3 py-2.5 active:bg-canvas"
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${food.name}`}
                  >
                    <Text className="font-sans text-xs text-primary">
                      {food.name}
                    </Text>
                    <Plus size={12} color="#78716C" strokeWidth={2} />
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* Totals preview */}
        {items.length > 0 && (
          <>
            <Separator className="mx-5 my-4" />
            <View className="px-5">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                TOTAL NUTRITION
              </Text>
              <NutritionGrid macros={totalMacros} size="sm" className="mt-3" />
            </View>
          </>
        )}
      </ScrollView>

      {/* Save button */}
      <View className="border-t border-border bg-surface px-5 py-4">
        <Button
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel="Save Dish"
        >
          <UIText>Save Dish</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
