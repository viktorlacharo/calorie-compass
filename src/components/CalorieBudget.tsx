import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type CalorieBudgetProps = {
  consumed: number;
  budget: number;
  className?: string;
};

export function CalorieBudget({
  consumed,
  budget,
  className,
}: CalorieBudgetProps) {
  const remaining = Math.max(0, budget - consumed);
  const percentage = budget > 0 ? Math.min(100, (consumed / budget) * 100) : 0;
  const isOver = consumed > budget;

  const formattedConsumed = Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(consumed);
  const formattedBudget = Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(budget);
  const formattedRemaining = Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(remaining);

  return (
    <View
      className={cn('items-center', className)}
      accessibilityRole="text"
      accessibilityLabel={`${formattedConsumed} of ${formattedBudget} calories consumed. ${isOver ? 'Over budget' : `${formattedRemaining} remaining`}`}
    >
      {/* Ring container */}
      <View className="relative h-40 w-40 items-center justify-center">
        {/* Outer track */}
        <View className="absolute h-full w-full rounded-full border-[3px] border-border" />
        {/* Progress arc — simplified to a clip approach */}
        <View
          className="absolute h-full w-full items-center justify-center"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <View
            className={cn(
              'absolute h-full w-full rounded-full border-[3px]',
              isOver ? 'border-accent-red' : 'border-accent-green'
            )}
            style={{
              // Use borderColor + opacity to simulate arc fill
              // Full arc: clip by making non-visible portions transparent
              opacity: percentage / 100,
            }}
          />
        </View>
        {/* Center text */}
        <View className="items-center">
          <Text
            className={cn(
              'font-mono-bold text-5xl tabular-nums',
              isOver ? 'text-accent-red' : 'text-primary'
            )}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formattedConsumed}
          </Text>
          <Text className="mt-0.5 font-sans text-[10px] tracking-widest uppercase text-secondary">
            OF {formattedBudget} KCAL
          </Text>
        </View>
      </View>

      {/* Remaining label */}
      <View className="mt-3 flex-row items-baseline">
        <Text
          className={cn(
            'font-mono-bold text-lg tabular-nums',
            isOver ? 'text-accent-red' : 'text-accent-green'
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {isOver ? '0' : formattedRemaining}
        </Text>
        <Text className="ml-1 font-sans text-[10px] tracking-widest uppercase text-secondary">
          {isOver ? 'OVER BUDGET' : 'REMAINING'}
        </Text>
      </View>
    </View>
  );
}
