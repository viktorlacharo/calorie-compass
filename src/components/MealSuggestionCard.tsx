import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MealSuggestion } from '@/types/nutrition';

type MealSuggestionCardProps = {
  suggestion: MealSuggestion;
  projectedScore: number;
  scoreDelta: number;
  projectedRemainingCalories: number;
  projectedRemainingProtein: number;
  currentScore: number;
  currentRemainingCalories: number;
  currentRemainingProtein: number;
  onConvertToRecipe: () => void;
  className?: string;
};

function DeltaRow({
  label,
  previousValue,
  nextValue,
  highlight = false,
  checked = false,
}: {
  label: string;
  previousValue: string;
  nextValue: string;
  highlight?: boolean;
  checked?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="w-14 font-sans text-[11px] uppercase tracking-[1.4px] text-secondary">{label}</Text>
      <Text className="font-sans-medium text-sm text-secondary">{previousValue}</Text>
      <Text className="font-sans text-sm text-muted">-&gt;</Text>
      <Text className={cn('font-sans-bold text-sm', highlight ? 'text-accent-green' : 'text-primary')}>{nextValue}</Text>
      {checked ? <Check size={14} color="#5DE619" strokeWidth={2.2} /> : null}
    </View>
  );
}

export function MealSuggestionCard({
  suggestion,
  projectedScore,
  scoreDelta,
  projectedRemainingCalories,
  projectedRemainingProtein,
  currentScore,
  currentRemainingCalories,
  currentRemainingProtein,
  onConvertToRecipe,
  className,
}: MealSuggestionCardProps) {
  return (
    <View className={cn('rounded-[30px] bg-surface px-5 py-5', className)}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 pr-2">
          <Text className="font-sans text-[10px] uppercase tracking-[2px] text-accent-blue">Idea sugerida</Text>
          <Text className="mt-2 font-sans-bold text-[24px] leading-7 text-primary">{suggestion.title}</Text>
          <Text className="mt-3 font-sans text-sm leading-6 text-secondary">{suggestion.description}</Text>
        </View>

        <View className="items-end">
          <Text className="font-sans-bold text-[30px] text-primary">{suggestion.estimatedCalories}</Text>
          <Text className="font-sans text-[10px] uppercase tracking-[1.6px] text-secondary">kcal aprox</Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {suggestion.foodNames.map((ingredient) => (
          <Badge key={ingredient} variant="secondary">
            <UIText className="text-[9px]">{ingredient}</UIText>
          </Badge>
        ))}
        <Badge variant="outline">
          <UIText className="text-[9px]">{suggestion.sourceLabel}</UIText>
        </Badge>
      </View>

      <Separator className="my-4" />

      <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Por que encaja hoy</Text>
      <Text className="mt-2 font-sans text-sm leading-6 text-secondary">{suggestion.whyItFits}</Text>

      <View className="mt-5">
        <Text className="font-sans text-[10px] uppercase tracking-[1.8px] text-secondary">Impacto nutricional</Text>
        <View className="mt-3 gap-3">
          <DeltaRow
            label="Score"
            previousValue={String(currentScore)}
            nextValue={String(projectedScore)}
            highlight={scoreDelta > 0}
          />
          <DeltaRow
            label="Prot"
            previousValue={`${Math.round(currentRemainingProtein)}g`}
            nextValue={`${Math.round(projectedRemainingProtein)}g`}
            highlight={projectedRemainingProtein < currentRemainingProtein}
            checked={projectedRemainingProtein <= 0}
          />
          <DeltaRow
            label="Kcal"
            previousValue={String(Math.round(currentRemainingCalories))}
            nextValue={String(Math.round(projectedRemainingCalories))}
            highlight={projectedRemainingCalories < currentRemainingCalories}
            checked={projectedRemainingCalories <= 0}
          />
        </View>
      </View>

      <Button className="mt-5" onPress={onConvertToRecipe} accessibilityLabel={`Convertir ${suggestion.title} en receta`}>
        <UIText>Convertir en receta</UIText>
      </Button>
    </View>
  );
}
