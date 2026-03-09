import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react-native';
import type { FavoriteDish } from '@/types/nutrition';

type FavoriteDishCardProps = {
  dish: FavoriteDish;
  /** Pre-calculated total macros for the dish */
  totalCalories?: number;
  itemCount?: number;
  onPress?: () => void;
  className?: string;
};

export function FavoriteDishCard({
  dish,
  totalCalories,
  itemCount,
  onPress,
  className,
}: FavoriteDishCardProps) {
  const count = itemCount ?? dish.items.length;
  const cals =
    totalCalories != null
      ? Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
          totalCalories
        )
      : '—';

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'border-border bg-surface border p-4 active:bg-canvas',
        className
      )}
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${count} items${totalCalories != null ? `, ${cals} calories` : ''}`}
    >
      {/* Icon + name row */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text
            className="font-sans-medium text-sm text-primary"
            numberOfLines={2}
          >
            {dish.name}
          </Text>
          <Text className="mt-0.5 font-sans text-[10px] tracking-widest uppercase text-muted">
            {count} {count === 1 ? 'ITEM' : 'ITEMS'}
          </Text>
        </View>
        <Heart size={14} color="#A8A29E" strokeWidth={1.5} />
      </View>

      {/* Calorie readout */}
      <View className="mt-3 border-t border-border pt-2">
        <Text
          className="font-mono-bold text-lg tabular-nums text-accent-green"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {cals}
          <Text className="font-mono text-[10px] text-muted"> kcal</Text>
        </Text>
      </View>
    </Pressable>
  );
}
