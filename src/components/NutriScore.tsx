import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { MacroBar } from '@/components/MacroBar';
import { cn } from '@/lib/utils';
import type { MacroNutrients } from '@/types/nutrition';

type NutriScoreProps = {
  score: number;
  macros: MacroNutrients;
  completion: number;
  remainingCalories: number;
  remainingProtein: number;
  title?: string;
  description?: string;
  scoreDelta?: number;
  previousRemainingCalories?: number;
  previousRemainingProtein?: number;
  className?: string;
  showChecks?: boolean;
};

function getScoreLabel(score: number) {
  if (score >= 88) return 'Muy bien';
  if (score >= 75) return 'Bien';
  return 'Ajustado';
}

function ScoreBadge({ children, checked = false }: { children: string; checked?: boolean }) {
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-forest-line bg-forest-panelAlt px-3 py-2">
      <Text className="font-sans text-xs text-primary">{children}</Text>
      {checked ? <Check size={14} color="#5DE619" strokeWidth={2.2} /> : null}
    </View>
  );
}

function CompletionBadge({ completion, checked }: { completion: number; checked: boolean }) {
  return <ScoreBadge checked={checked}>{checked ? 'Objetivo calorico cubierto' : `${completion}% del objetivo calorico`}</ScoreBadge>;
}

function RemainingCaloriesBadge({ remainingCalories, checked }: { remainingCalories: number; checked: boolean }) {
  return <ScoreBadge checked={checked}>{checked ? 'Kcal cubiertas' : `${Math.round(remainingCalories)} kcal restantes`}</ScoreBadge>;
}

function RemainingProteinBadge({ remainingProtein, checked }: { remainingProtein: number; checked: boolean }) {
  return <ScoreBadge checked={checked}>{checked ? 'Prot cubierta' : `Prot ${Math.round(remainingProtein)}g por cubrir`}</ScoreBadge>;
}

export function NutriScore({
  score,
  macros,
  completion,
  remainingCalories,
  remainingProtein,
  title = 'Puntuacion nutricional',
  description,
  scoreDelta,
  previousRemainingCalories,
  previousRemainingProtein,
  className,
  showChecks = false,
}: NutriScoreProps) {
  const scoreLabel = getScoreLabel(score);
  const completionChecked = showChecks && completion >= 100;
  const caloriesChecked = showChecks && remainingCalories <= 0;
  const proteinChecked = showChecks && remainingProtein <= 0;
  const deltaLabel = typeof scoreDelta === 'number' ? `${scoreDelta > 0 ? '+' : ''}${scoreDelta}` : null;
  const showImpactLine =
    typeof previousRemainingCalories === 'number' && typeof previousRemainingProtein === 'number';

  return (
    <View className={cn(className)}>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 pr-2">
          <Text className="font-sans-bold text-xl text-primary">{title}</Text>
          {description ? (
            <Text className="mt-2 font-sans text-sm leading-5 text-secondary">{description}</Text>
          ) : null}
          {deltaLabel ? (
            <Text className={`mt-3 font-sans-medium text-sm ${scoreDelta && scoreDelta >= 0 ? 'text-accent-green' : 'text-secondary'}`}>
              Cambio estimado {deltaLabel}
            </Text>
          ) : null}
        </View>
        <View className="h-24 w-24 items-center justify-center rounded-full border-[6px] border-accent-green/20 bg-forest-panelAlt">
          <Text className="font-sans-bold text-[28px] text-primary">{score}</Text>
          <Text className="font-sans text-[10px] uppercase tracking-[1.4px] text-secondary">{scoreLabel}</Text>
        </View>
      </View>

      <View className="mt-5">
        <MacroBar macros={macros} />
      </View>

      {showImpactLine ? (
        <Text className="mt-4 font-sans text-sm leading-5 text-secondary">
          Prot {Math.round(previousRemainingProtein)}g {'->'} {Math.round(remainingProtein)}g • {Math.round(previousRemainingCalories)} kcal {'->'} {Math.round(remainingCalories)} kcal
        </Text>
      ) : null}

      <View className="mt-5 flex-row flex-wrap gap-2">
        <CompletionBadge completion={completion} checked={completionChecked} />
        <RemainingCaloriesBadge remainingCalories={remainingCalories} checked={caloriesChecked} />
        <RemainingProteinBadge remainingProtein={remainingProtein} checked={proteinChecked} />
      </View>
    </View>
  );
}
