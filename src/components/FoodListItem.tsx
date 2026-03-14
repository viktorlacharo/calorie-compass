import { Image, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { MacroMicroTable } from '@/components/MacroMicroTable';
import { getSupermarketMeta } from '@/constants/supermarkets';
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

  const supermarket = getSupermarketMeta(food.supermarket);

  return (
    <View className={cn('border-b border-border py-5', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-sans-medium text-base text-primary" numberOfLines={1}>
              {food.name}
            </Text>

            <View className="flex-row items-center gap-3">
              <Text className="font-sans-bold text-lg text-primary">{cals} kcal</Text>
              <ChevronRight size={16} color="#70806E" strokeWidth={1.7} />
            </View>
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">
              {food.servingSize}
              {food.servingUnit}
            </Text>
            <View className="h-1 w-1 rounded-full bg-muted" />
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-muted">
              por 100{food.servingUnit}
            </Text>

            {supermarket ? (
              <>
                <View className="h-1 w-1 rounded-full bg-muted" />
                <View className="flex-row items-center gap-2">
                  <Image source={supermarket.logo} className="h-4 w-4 rounded-full" resizeMode="contain" />
                  <Text className="font-sans text-[10px] uppercase tracking-[1.2px] text-secondary">
                    {supermarket.label}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <MacroMicroTable macros={food.per100g} className="mt-4 bg-transparent px-0" />
    </View>
  );
}
