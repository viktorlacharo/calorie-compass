import { Text, View } from 'react-native';
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
      <View
        className={cn('h-3 w-full rounded-full bg-forest-line', className)}
        accessibilityRole="text"
        accessibilityLabel="No hay datos de macros"
      />
    );
  }

  const proteinPct = Math.round((proteinCal / total) * 100);
  const carbsPct = Math.round((carbsCal / total) * 100);
  const fatsPct = 100 - proteinPct - carbsPct;

  return (
    <View
      className={cn(className)}
      accessibilityRole="text"
      accessibilityLabel={`Reparto de macros: ${proteinPct}% proteina, ${carbsPct}% carbohidratos, ${fatsPct}% grasa`}
    >
      <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-black/20">
        {proteinPct > 0 && (
          <View className="h-full bg-protein" style={{ width: `${proteinPct}%` }} />
        )}
        {carbsPct > 0 && (
          <View className="h-full bg-carbs" style={{ width: `${carbsPct}%` }} />
        )}
        {fatsPct > 0 && (
          <View className="h-full bg-fat" style={{ width: `${fatsPct}%` }} />
        )}
      </View>
      <View className="mt-3 flex-row justify-between">
        <Text className="font-sans text-[11px] uppercase tracking-[1px] text-protein">
          Prote {proteinPct}%
        </Text>
        <Text className="font-sans text-[11px] uppercase tracking-[1px] text-carbs">
          Carbs. {carbsPct}%
        </Text>
        <Text className="font-sans text-[11px] uppercase tracking-[1px] text-fat">
          Grasas {fatsPct}%
        </Text>
      </View>
    </View>
  );
}
