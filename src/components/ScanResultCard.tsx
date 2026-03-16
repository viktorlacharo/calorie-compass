import { View, Text } from 'react-native';
import { ScanLine, Sparkles } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { MacroMicroTable } from '@/components/MacroMicroTable';
import { NutritionGrid } from '@/components/NutritionGrid';
import { Badge } from '@/components/ui/badge';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { formatGramAmount } from '@/utils/foodMeasurements';
import type { VisualAnalysisResult, NutritionLabelScanResult } from '@/types/nutrition';

type ScanResultCardProps = {
  result: VisualAnalysisResult | NutritionLabelScanResult;
  variant: 'visual' | 'label';
  className?: string;
};

function isVisualResult(result: VisualAnalysisResult | NutritionLabelScanResult): result is VisualAnalysisResult {
  return 'items' in result;
}

export function ScanResultCard({ result, variant, className }: ScanResultCardProps) {
  if (variant === 'label' && !isVisualResult(result)) {
    return <LabelScanCard result={result} className={className} />;
  }

  if (variant === 'visual' && isVisualResult(result)) {
    return <VisualScanCard result={result} className={className} />;
  }

  return null;
}

function LabelScanCard({ result, className }: { result: NutritionLabelScanResult; className?: string }) {
  const confidence = Math.round(result.confidence * 100);

  return (
    <View
      className={cn('rounded-[32px] border border-border bg-surface/95 px-5 py-5', className)}
      accessibilityRole="summary"
      accessibilityLabel={`Resultado del escaneo: ${result.detectedName}, ${confidence}% de confianza`}
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
              <ScanLine size={18} color="#EC5B13" strokeWidth={2} />
            </View>
            <View>
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Etiqueta interpretada</Text>
              <Text className="mt-1 font-sans-bold text-xl text-primary">{result.detectedName}</Text>
            </View>
          </View>
        </View>

        <Badge variant="outline" className="border-brand/30 bg-brand/10 px-3 py-1.5">
          <UIText className="text-[10px] text-brand">{confidence}%</UIText>
        </Badge>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-forest-panelAlt px-3 py-2">
          <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
            referencia {formatGramAmount(result.referenceAmount)}
          </Text>
        </View>
        {result.defaultServingAmount ? (
          <View className="rounded-full bg-forest-panelAlt px-3 py-2">
            <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
              racion {formatGramAmount(result.defaultServingAmount)}
            </Text>
          </View>
        ) : null}
        <View className="rounded-full bg-forest-panelAlt px-3 py-2">
          <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">Lectura automatica</Text>
        </View>
      </View>

      <View className="mt-5 rounded-[24px] border border-border bg-forest-panelAlt/70 px-4 py-4">
        <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Validacion</Text>
        <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
          Revisa estos datos antes de guardar para mantener tu catalogo fino y consistente.
        </Text>
      </View>

      <Separator className="my-5" />
      <NutritionGrid macros={result.referenceMacros} size="sm" />
    </View>
  );
}

function VisualScanCard({ result, className }: { result: VisualAnalysisResult; className?: string }) {
  return (
    <View
      className={cn('rounded-[32px] border border-border bg-surface/95 px-5 py-5', className)}
      accessibilityRole="summary"
      accessibilityLabel={`Analisis visual: ${result.items.length} elementos detectados`}
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-green/10">
              <Sparkles size={18} color="#16A34A" strokeWidth={2} />
            </View>
            <View>
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Lectura del plato</Text>
              <Text className="mt-1 font-sans-bold text-xl text-primary">Elementos detectados</Text>
            </View>
          </View>
        </View>

        <Badge variant="outline" className="border-white/10 bg-forest-panelAlt px-3 py-1.5">
          <UIText className="text-[10px] text-secondary">
            {result.items.length} {result.items.length === 1 ? 'item' : 'items'}
          </UIText>
        </Badge>
      </View>

      <View className="mt-5 gap-3">
        {result.items.map((item, index) => {
          const confidence = Math.round(item.confidence * 100);

          return (
            <View key={`${item.detectedFoodName}-${index}`} className={index === 0 ? '' : 'border-t border-border pt-4'}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-sans-medium text-base text-primary">{item.detectedFoodName}</Text>
                  <Text className="mt-1 font-mono text-[10px] tabular-nums text-secondary">
                    ~{item.estimatedQuantity}g
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="font-sans-bold text-base text-primary">{item.estimatedMacros.calories} kcal</Text>
                  <Text className="mt-1 font-sans text-[10px] uppercase tracking-[1.1px] text-secondary">{confidence}% encaje</Text>
                </View>
              </View>

              <MacroMicroTable macros={item.estimatedMacros} className="" />
            </View>
          );
        })}
      </View>

      <Separator className="my-5" />
      <NutritionGrid macros={result.total} size="sm" />
    </View>
  );
}
