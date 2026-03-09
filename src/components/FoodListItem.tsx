import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react-native';
import type { Food } from '@/types/nutrition';

type FoodListItemProps = {
  food: Food;
  onPress?: () => void;
  className?: string;
};

export function FoodListItem({ food, onPress, className }: FoodListItemProps) {
  const cals = Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(food.per100g.calories);

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center border-b border-border bg-surface px-4 py-3 active:bg-canvas',
        className
      )}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${cals} calories per 100 ${food.servingUnit}`}
    >
      {/* Left: name + serving info */}
      <View className="flex-1">
        <Text className="font-sans-medium text-sm text-primary" numberOfLines={1}>
          {food.name}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="font-mono text-[10px] tabular-nums text-secondary">
            {food.servingSize}
            {food.servingUnit}
          </Text>
          <View className="h-0.5 w-0.5 rounded-full bg-muted" />
          <Text className="font-mono text-[10px] tabular-nums text-muted">
            per 100{food.servingUnit}
          </Text>
        </View>
      </View>

      {/* Right: macro summary */}
      <View className="flex-row items-center gap-3">
        <View className="items-end">
          <Text
            className="font-mono-bold text-sm tabular-nums text-accent-green"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {cals}
          </Text>
          <Text className="font-mono text-[9px] text-muted">kcal</Text>
        </View>
        <View className="flex-row gap-1.5">
          <Text
            className="font-mono text-[10px] tabular-nums text-accent-blue"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            P{food.per100g.protein}
          </Text>
          <Text
            className="font-mono text-[10px] tabular-nums text-accent-amber"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            C{food.per100g.carbs}
          </Text>
          <Text
            className="font-mono text-[10px] tabular-nums text-accent-red"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            F{food.per100g.fats}
          </Text>
        </View>
        <ChevronRight size={14} color="#A8A29E" strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
