import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Play } from 'lucide-react-native';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { sumMacros } from '@/utils/sumMacros';
import { mockFavoriteDishes, mockFoods } from '@/mocks/nutrition';
import type { MacroNutrients } from '@/types/nutrition';

export default function FavoriteDishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const dish = mockFavoriteDishes.find((d) => d.id === id);

  if (!dish) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="font-sans-medium text-sm text-secondary">
            Dish not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Resolve items to their food entries and calculate macros
  const resolvedItems = dish.items.map((item) => {
    const food = mockFoods.find((f) => f.id === item.foodId);
    const macros = food
      ? calculatePerServing(food.per100g, item.quantity)
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return { ...item, food, macros };
  });

  const totalMacros: MacroNutrients = sumMacros(
    resolvedItems.map((i) => i.macros)
  );

  const createdDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dish.createdAt));

  function handleDelete() {
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to delete "${dish!.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Dish',
          style: 'destructive',
          onPress: () => {
            // TODO: delete from DynamoDB
            router.back();
          },
        },
      ]
    );
  }

  function handleLogDish() {
    // TODO: log this dish as a meal via API
    Alert.alert('Meal Logged', `"${dish!.name}" has been logged.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
          </Pressable>
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            DISH DETAIL
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          className="h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Delete Dish"
        >
          <Trash2 size={16} color="#DC2626" strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View className="px-5 pt-5">
          <Text className="font-sans-bold text-lg text-primary">
            {dish.name}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Badge variant="secondary">
              <UIText className="text-[9px]">
                {dish.items.length}{' '}
                {dish.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </UIText>
            </Badge>
            <Text className="font-sans text-[10px] text-muted">
              Created {createdDate}
            </Text>
          </View>
        </View>

        <Separator className="mx-5 my-4" />

        {/* Total nutrition */}
        <View className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            TOTAL NUTRITION
          </Text>
          <NutritionGrid macros={totalMacros} size="md" className="mt-3" />
          <MacroBar macros={totalMacros} className="mt-3" />
        </View>

        <Separator className="mx-5 my-4" />

        {/* Ingredients */}
        <View className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            INGREDIENTS
          </Text>

          {resolvedItems.map((item, index) => (
            <View
              key={index}
              className="mt-3 flex-row items-center justify-between border border-border bg-surface p-3"
            >
              <View className="flex-1">
                <Text
                  className="font-sans-medium text-xs text-primary"
                  numberOfLines={1}
                >
                  {item.food?.name ?? 'Unknown Food'}
                </Text>
                <Text className="mt-0.5 font-mono text-[10px] tabular-nums text-secondary">
                  {item.quantity}
                  {item.unit}
                </Text>
              </View>
              <Text
                className="font-mono-bold text-sm tabular-nums text-accent-green"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {item.macros.calories}
                <Text className="font-mono text-[9px] text-muted">
                  {' '}
                  kcal
                </Text>
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Log dish button */}
      <View className="border-t border-border bg-surface px-5 py-4">
        <Button onPress={handleLogDish} accessibilityLabel="Log This Dish">
          <UIText>Log This Dish</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
