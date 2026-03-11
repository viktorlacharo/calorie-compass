import { Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { cn } from '@/lib/utils';
import type { Food } from '@/types/nutrition';

type FoodListItemProps = {
  food: Food;
  className?: string;
};

export function FoodListItem({ food, className }: FoodListItemProps) {
  const cals = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(food.per100g.calories);

  return (
    <GlassPanel className={cn('px-4 py-4', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans-medium text-base text-primary" numberOfLines={1}>
            {food.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">
              {food.servingSize}
              {food.servingUnit}
            </Text>
            <View className="h-1 w-1 rounded-full bg-muted" />
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-muted">
              por 100{food.servingUnit}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="font-sans-bold text-lg text-primary">{cals}</Text>
          <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-brand">kcal</Text>
        </View>

        <ChevronRight size={16} color="#70806E" strokeWidth={1.7} />
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="rounded-full bg-protein/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-protein">P {food.per100g.protein}g</Text>
        </View>
        <View className="rounded-full bg-carbs/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-carbs">C {food.per100g.carbs}g</Text>
        </View>
        <View className="rounded-full bg-fat/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-fat">G {food.per100g.fats}g</Text>
        </View>
      </View>
    </GlassPanel>
  );
}
