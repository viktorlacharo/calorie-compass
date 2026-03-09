import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type MacroType = 'calories' | 'protein' | 'carbs' | 'fats';

const MACRO_CONFIG: Record<
  MacroType,
  { label: string; unit: string; color: string }
> = {
  calories: { label: 'CAL', unit: 'kcal', color: 'text-accent-green' },
  protein: { label: 'PRO', unit: 'g', color: 'text-accent-blue' },
  carbs: { label: 'CARB', unit: 'g', color: 'text-accent-amber' },
  fats: { label: 'FAT', unit: 'g', color: 'text-accent-red' },
};

type MacroReadoutProps = {
  type: MacroType;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function MacroReadout({
  type,
  value,
  size = 'md',
  className,
}: MacroReadoutProps) {
  const config = MACRO_CONFIG[type];

  const valueSizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
  } as const;

  const labelSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  } as const;

  const formatted =
    type === 'calories'
      ? Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
      : Intl.NumberFormat('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);

  return (
    <View
      className={cn('items-start', className)}
      accessibilityRole="text"
      accessibilityLabel={`${config.label}: ${formatted} ${config.unit}`}
    >
      <Text
        className={cn(
          'tracking-widest uppercase font-sans-medium',
          labelSizes[size],
          config.color
        )}
      >
        {config.label}
      </Text>
      <View className="flex-row items-baseline">
        <Text
          className={cn(
            'font-mono-bold tabular-nums text-primary',
            valueSizes[size]
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatted}
        </Text>
        <Text
          className={cn(
            'ml-0.5 font-mono text-muted',
            size === 'lg' ? 'text-sm' : 'text-[10px]'
          )}
        >
          {config.unit}
        </Text>
      </View>
    </View>
  );
}
