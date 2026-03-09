import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { NutritionGrid } from '@/components/NutritionGrid';
import { Badge } from '@/components/ui/badge';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import type { MealLogEntry } from '@/types/nutrition';

const SOURCE_LABELS: Record<MealLogEntry['source'], string> = {
  manual: 'MANUAL',
  favorite: 'FAVORITE',
  'visual-analysis': 'AI SCAN',
};

type MealLogCardProps = {
  entry: MealLogEntry;
  onPress?: () => void;
  className?: string;
};

export function MealLogCard({ entry, onPress, className }: MealLogCardProps) {
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(entry.consumedAt));

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'border-border bg-surface border px-4 py-3 active:bg-canvas',
        className
      )}
      accessibilityRole="button"
      accessibilityLabel={`Meal logged at ${time}, ${entry.total.calories} calories`}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text
            className="font-mono-medium text-sm tabular-nums text-primary"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {time}
          </Text>
          <Badge variant="secondary">
            <UIText className="text-[9px]">
              {SOURCE_LABELS[entry.source]}
            </UIText>
          </Badge>
        </View>
        <Text
          className="font-mono-bold text-lg tabular-nums text-accent-green"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
            entry.total.calories
          )}
          <Text className="font-mono text-xs text-muted"> kcal</Text>
        </Text>
      </View>

      {/* Notes */}
      {entry.notes && (
        <Text className="mt-1 font-sans text-xs text-secondary">
          {entry.notes}
        </Text>
      )}

      {/* Macro details */}
      <Separator className="my-2" />
      <NutritionGrid macros={entry.total} size="sm" />
    </Pressable>
  );
}
