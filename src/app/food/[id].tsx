import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { NutritionGrid } from '@/components/NutritionGrid';
import { MacroBar } from '@/components/MacroBar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { calculatePerServing } from '@/utils/calculatePerServing';
import { mockFoods } from '@/mocks/nutrition';

export default function FoodDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const food = mockFoods.find((f) => f.id === id);

  if (!food) {
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
            Food not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const perServing = calculatePerServing(food.per100g, food.servingSize);

  const createdDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(food.createdAt));

  function handleDelete() {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete "${food!.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Food',
          style: 'destructive',
          onPress: () => {
            // TODO: delete from DynamoDB
            router.back();
          },
        },
      ]
    );
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
            FOOD DETAIL
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          className="h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Delete Food"
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
            {food.name}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Badge variant="secondary">
              <UIText className="text-[9px]">
                {food.servingSize}
                {food.servingUnit}
              </UIText>
            </Badge>
            <Text className="font-sans text-[10px] text-muted">
              Added {createdDate}
            </Text>
          </View>
        </View>

        <Separator className="mx-5 my-4" />

        {/* Per 100g */}
        <View className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            PER 100{food.servingUnit.toUpperCase()}
          </Text>
          <NutritionGrid macros={food.per100g} size="md" className="mt-3" />
          <MacroBar macros={food.per100g} className="mt-3" />
        </View>

        <Separator className="mx-5 my-4" />

        {/* Per serving */}
        <View className="px-5">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            PER SERVING ({food.servingSize}
            {food.servingUnit.toUpperCase()})
          </Text>
          <NutritionGrid macros={perServing} size="md" className="mt-3" />
          <MacroBar macros={perServing} className="mt-3" />
        </View>
      </ScrollView>

      {/* Edit button */}
      <View className="border-t border-border bg-surface px-5 py-4">
        <Button
          variant="outline"
          accessibilityLabel="Edit Food"
          onPress={() => {
            // TODO: navigate to edit mode
          }}
        >
          <UIText>Edit Food</UIText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
