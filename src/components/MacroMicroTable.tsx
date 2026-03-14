import { Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import type { MacroNutrients } from '@/types/nutrition';

type MacroMicroTableProps = {
  macros: Pick<MacroNutrients, 'protein' | 'carbs' | 'fats'>;
  className?: string;
};

function formatValue(value: number) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function MacroMicroTable({ macros, className }: MacroMicroTableProps) {
  return (
    <View className={cn('', className)}>

      <View className="gap-2 flex-row">
        <View className="items-center">
          <Text className="font-mono text-[12px] text-protein">{formatValue(macros.protein)}g</Text>
        </View>
        <View className="items-center">
          <Text className="font-mono text-[12px] text-carbs">{formatValue(macros.carbs)}g</Text>
        </View>
        <View className="items-center">
          <Text className="font-mono text-[12px] text-fat">{formatValue(macros.fats)}g</Text>
        </View>
      </View>
    </View>
  );
}
