import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { MacroReadout } from '@/components/MacroReadout';
import type { MacroNutrients } from '@/types/nutrition';

type NutritionGridProps = {
  macros: MacroNutrients;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function NutritionGrid({
  macros,
  size = 'md',
  className,
}: NutritionGridProps) {
  return (
    <View
      className={cn('flex-row justify-between', className)}
      accessibilityRole="summary"
      accessibilityLabel="Nutrition breakdown"
    >
      <MacroReadout type="calories" value={macros.calories} size={size} />
      <MacroReadout type="protein" value={macros.protein} size={size} />
      <MacroReadout type="carbs" value={macros.carbs} size={size} />
      <MacroReadout type="fats" value={macros.fats} size={size} />
    </View>
  );
}
