import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Minus } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { NutritionGrid } from '@/components/NutritionGrid';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
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
    const macrosList = items.map((item) => calculatePerServing(item.food.per100g, item.quantity));
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
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: Number(qty) || 0 } : item)));
  }

  function handleSave() {
    Alert.alert('Plato creado', `"${name}" se ha guardado con ${items.length} ingredientes.`, [
      { text: 'Vale', onPress: () => router.back() },
    ]);
  }

  const availableFoods = mockFoods.filter((f) => !items.some((i) => i.food.id === f.id));

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
          CREAR PLATO FAVORITO
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTransition variant="right" className="px-5 pt-5">
          <Label nativeID="dish-name">Nombre del plato</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Ej. bowl de comida"
            className="mt-1.5"
            autoFocus
            accessibilityLabelledBy="dish-name"
            accessibilityLabel="Nombre del plato"
          />
        </ScreenTransition>

        <Separator className="mx-5 my-4" />

        <ScreenTransition variant="right" delay={40} className="px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
              INGREDIENTES
            </Text>
            <Text className="font-mono text-[10px] tabular-nums text-muted">
              {items.length} {items.length === 1 ? 'ingrediente' : 'ingredientes'}
            </Text>
          </View>

          {items.map((item, index) => (
            <GlassPanel key={item.food.id} className="mt-3 px-4 py-4">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
                    {item.food.name}
                  </Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <Input
                      value={String(item.quantity)}
                      onChangeText={(v) => updateQuantity(index, v)}
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
                  <Minus size={14} color="#FBBF24" strokeWidth={2} />
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
                <Text className="font-sans text-[10px] tracking-widest uppercase text-muted">
                  ELIGE UN ALIMENTO
                </Text>
                <Pressable
                  onPress={() => setShowFoodPicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar seleccion"
                >
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
                    <Plus size={12} color="#78716C" strokeWidth={2} />
                  </Pressable>
                ))
              )}
            </GlassPanel>
          )}
        </ScreenTransition>

        {items.length > 0 && (
          <>
            <Separator className="mx-5 my-4" />
            <ScreenTransition variant="right" delay={80} className="px-5">
              <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
                TOTAL NUTRICIONAL
              </Text>
              <NutritionGrid macros={totalMacros} size="sm" className="mt-3" />
            </ScreenTransition>
          </>
        )}
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 py-4">
        <Button onPress={handleSave} disabled={!canSave} accessibilityLabel="Guardar plato">
          <UIText>Guardar plato</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
