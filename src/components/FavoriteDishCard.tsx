import { Text, View } from 'react-native';
import { ChevronRight, Heart } from 'lucide-react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { cn } from '@/lib/utils';
import type { FavoriteDish, MacroNutrients } from '@/types/nutrition';

type FavoriteDishCardProps = {
  dish: FavoriteDish;
  totals: MacroNutrients;
  className?: string;
};

export function FavoriteDishCard({ dish, totals, className }: FavoriteDishCardProps) {
  const cals = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(totals.calories);

  return (
    <GlassPanel className={cn('px-4 py-4', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans-medium text-base text-primary" numberOfLines={1}>
            {dish.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">
              {dish.items.length} ingredientes
            </Text>
            <View className="h-1 w-1 rounded-full bg-muted" />
            <Text className="font-sans text-[11px] uppercase tracking-[1.4px] text-muted">
              plato guardado
            </Text>
          </View>
        </View>

        <View className="items-end">
          <View className="mb-2 h-9 w-9 items-center justify-center rounded-full border border-border bg-protein/10">
            <Heart size={14} color="#EC5B13" strokeWidth={1.8} />
          </View>
          <Text className="font-sans-bold text-lg text-primary">{cals}</Text>
          <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-brand">kcal</Text>
        </View>

        <ChevronRight size={16} color="#70806E" strokeWidth={1.7} />
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="rounded-full bg-protein/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-protein">P {totals.protein}g</Text>
        </View>
        <View className="rounded-full bg-carbs/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-carbs">C {totals.carbs}g</Text>
        </View>
        <View className="rounded-full bg-fat/10 px-3 py-2">
          <Text className="font-sans text-[11px] text-fat">G {totals.fats}g</Text>
        </View>
      </View>
    </GlassPanel>
  );
}
