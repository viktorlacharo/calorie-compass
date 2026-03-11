import { Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Progress } from '@/components/ui/progress';
import { GlassPanel } from '@/components/GlassPanel';
import { cn } from '@/lib/utils';

type CalorieBudgetProps = {
  consumed: number;
  budget: number;
  className?: string;
};

export function CalorieBudget({ consumed, budget, className }: CalorieBudgetProps) {
  const remaining = Math.max(0, budget - consumed);
  const percentage = budget > 0 ? Math.min(100, Math.round((consumed / budget) * 100)) : 0;

  const formattedConsumed = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(consumed);
  const formattedBudget = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(budget);
  const formattedRemaining = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(remaining);

  return (
    <GlassPanel
      glow
      className={cn('px-5 py-5', className)}
      accessibilityRole="text"
      accessibilityLabel={`${formattedConsumed} de ${formattedBudget} calorias consumidas. Quedan ${formattedRemaining} calorias.`}
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="font-sans text-[11px] uppercase tracking-[2px] text-secondary">
            Objetivo calorico
          </Text>
          <View className="mt-2 flex-row flex-wrap items-end gap-2">
            <Text
              className="font-sans-bold text-[38px] leading-[42px] text-primary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formattedConsumed}
            </Text>
            <Text className="mb-1 font-sans text-sm text-secondary">
              / {formattedBudget} kcal
            </Text>
          </View>
        </View>

        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-forest-panelAlt border border-border">
          <Flame size={22} color="#5DE619" strokeWidth={2} />
        </View>
      </View>

      <Progress
        value={percentage}
        className="mt-6 h-3 bg-black/20"
        indicatorClassName="rounded-full bg-brand"
      />

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="font-sans-medium text-sm text-accent-green">
          {percentage}% completado
        </Text>
        <Text className="font-sans text-sm text-secondary">
          {formattedRemaining} kcal restantes
        </Text>
      </View>
    </GlassPanel>
  );
}
