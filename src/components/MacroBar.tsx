import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import type { MacroNutrients } from '@/types/nutrition';

type MacroBarProps = {
  macros: MacroNutrients;
  className?: string;
};

export function MacroBar({ macros, className }: MacroBarProps) {
  const proteinCal = macros.protein * 4;
  const carbsCal = macros.carbs * 4;
  const fatsCal = macros.fats * 9;
  const total = proteinCal + carbsCal + fatsCal;

  if (total === 0) {
    return (
      <View className={cn('h-2 w-full rounded-full bg-border', className)} />
    );
  }

  const proteinPct = Math.round((proteinCal / total) * 100);
  const carbsPct = Math.round((carbsCal / total) * 100);
  const fatsPct = 100 - proteinPct - carbsPct;

  return (
    <View
      className={cn(className)}
      accessibilityRole="text"
      accessibilityLabel={`Macro ratio: ${proteinPct}% protein, ${carbsPct}% carbs, ${fatsPct}% fat`}
    >
      <View className="h-2 w-full flex-row overflow-hidden rounded-full">
        {proteinPct > 0 && (
          <View
            className="h-full bg-accent-blue"
            style={{ width: `${proteinPct}%` }}
          />
        )}
        {carbsPct > 0 && (
          <View
            className="h-full bg-accent-amber"
            style={{ width: `${carbsPct}%` }}
          />
        )}
        {fatsPct > 0 && (
          <View
            className="h-full bg-accent-red"
            style={{ width: `${fatsPct}%` }}
          />
        )}
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <Text className="font-mono text-[9px] tabular-nums text-accent-blue">
          P {proteinPct}%
        </Text>
        <Text className="font-mono text-[9px] tabular-nums text-accent-amber">
          C {carbsPct}%
        </Text>
        <Text className="font-mono text-[9px] tabular-nums text-accent-red">
          F {fatsPct}%
        </Text>
      </View>
    </View>
  );
}
