import { View } from 'react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { MacroReadout } from '@/components/MacroReadout';
import { cn } from '@/lib/utils';
import type { MacroNutrients } from '@/types/nutrition';

type NutritionGridProps = {
  macros: MacroNutrients;
  size?: 'sm' | 'md' | 'lg';
  progressTargets?: Partial<Record<'protein' | 'carbs' | 'fats', number>>;
  className?: string;
};

export function NutritionGrid({
  macros,
  size = 'md',
  progressTargets,
  className,
}: NutritionGridProps) {
  const defaults = {
    protein: 140,
    carbs: 240,
    fats: 70,
    ...progressTargets,
  };

  return (
    <View
      className={cn('flex-row flex-wrap gap-3', className)}
      accessibilityRole="summary"
      accessibilityLabel="Desglose de macros"
    >
      <GlassPanel className="min-w-[31%] flex-1 px-4 py-4 border-t-2 border-t-protein">
        <MacroReadout
          type="protein"
          value={macros.protein}
          size={size === 'lg' ? 'md' : size}
          progress={(macros.protein / defaults.protein) * 100}
        />
      </GlassPanel>
      <GlassPanel className="min-w-[31%] flex-1 px-4 py-4 border-t-2 border-t-carbs">
        <MacroReadout
          type="carbs"
          value={macros.carbs}
          size={size === 'lg' ? 'md' : size}
          progress={(macros.carbs / defaults.carbs) * 100}
        />
      </GlassPanel>
      <GlassPanel className="min-w-[31%] flex-1 px-4 py-4 border-t-2 border-t-fat">
        <MacroReadout
          type="fats"
          value={macros.fats}
          size={size === 'lg' ? 'md' : size}
          progress={(macros.fats / defaults.fats) * 100}
        />
      </GlassPanel>
    </View>
  );
}
