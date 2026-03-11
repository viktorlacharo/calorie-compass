import { Text, View } from 'react-native';
import { cn } from '@/lib/utils';

type MacroType = 'calories' | 'protein' | 'carbs' | 'fats';

const MACRO_CONFIG: Record<
  MacroType,
  { label: string; unit: string; color: string; bar: string }
> = {
  calories: {
    label: 'Calorias',
    unit: 'kcal',
    color: 'text-brand',
    bar: 'bg-brand',
  },
  protein: {
    label: 'Proteina',
    unit: 'g',
    color: 'text-protein',
    bar: 'bg-protein',
  },
  carbs: {
    label: 'Carbohidratos',
    unit: 'g',
    color: 'text-carbs',
    bar: 'bg-carbs',
  },
  fats: {
    label: 'Grasas',
    unit: 'g',
    color: 'text-fat',
    bar: 'bg-fat',
  },
};

type MacroReadoutProps = {
  type: MacroType;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  progress?: number;
  className?: string;
};

export function MacroReadout({
  type,
  value,
  size = 'md',
  progress,
  className,
}: MacroReadoutProps) {
  const config = MACRO_CONFIG[type];

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-[26px]',
    lg: 'text-4xl',
  } as const;

  const formatted =
    type === 'calories'
      ? Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)
      : Intl.NumberFormat('es-ES', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);

  const clamped = progress == null ? null : Math.max(0, Math.min(progress, 100));

  return (
    <View
      className={cn('items-start', className)}
      accessibilityRole="text"
      accessibilityLabel={`${config.label}: ${formatted} ${config.unit}`}
    >
      <Text className="font-sans text-[11px] text-secondary">{config.label}</Text>
      <View className="mt-1 flex-row items-baseline gap-1.5">
        <Text
          className={cn('font-sans-bold leading-none text-primary', valueSizes[size])}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatted}
        </Text>
        <Text className={cn('font-sans text-xs uppercase', config.color)}>{config.unit}</Text>
      </View>

      {clamped != null ? (
        <View className="mt-3 h-1.5 w-full rounded-full bg-black/20">
          <View className={cn('h-full rounded-full', config.bar)} style={{ width: `${clamped}%` }} />
        </View>
      ) : null}
    </View>
  );
}
