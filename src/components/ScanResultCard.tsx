import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { NutritionGrid } from '@/components/NutritionGrid';
import { Badge } from '@/components/ui/badge';
import { Text as UIText } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import type {
  VisualAnalysisResult,
  NutritionLabelScanResult,
} from '@/types/nutrition';

type ScanResultCardProps = {
  result: VisualAnalysisResult | NutritionLabelScanResult;
  variant: 'visual' | 'label';
  className?: string;
};

function isVisualResult(
  result: VisualAnalysisResult | NutritionLabelScanResult
): result is VisualAnalysisResult {
  return 'items' in result;
}

export function ScanResultCard({
  result,
  variant,
  className,
}: ScanResultCardProps) {
  if (variant === 'label' && !isVisualResult(result)) {
    return <LabelScanCard result={result} className={className} />;
  }

  if (variant === 'visual' && isVisualResult(result)) {
    return <VisualScanCard result={result} className={className} />;
  }

  return null;
}

function LabelScanCard({
  result,
  className,
}: {
  result: NutritionLabelScanResult;
  className?: string;
}) {
  const confidence = Math.round(result.confidence * 100);

  return (
    <View
      className={cn('border-border bg-surface border p-4', className)}
      accessibilityRole="summary"
      accessibilityLabel={`Scan result: ${result.detectedName}, ${confidence}% confidence`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-medium text-sm text-primary">
          {result.detectedName}
        </Text>
        <Badge variant="outline">
          <UIText className="text-[9px]">{confidence}%</UIText>
        </Badge>
      </View>

      <Text className="mt-1 font-mono text-[10px] tabular-nums text-secondary">
        {result.servingSize}
        {result.servingUnit} per serving
      </Text>

      <Separator className="my-3" />

      <NutritionGrid macros={result.macrosPerServing} size="sm" />
    </View>
  );
}

function VisualScanCard({
  result,
  className,
}: {
  result: VisualAnalysisResult;
  className?: string;
}) {
  return (
    <View
      className={cn('border-border bg-surface border p-4', className)}
      accessibilityRole="summary"
      accessibilityLabel={`Visual analysis: ${result.items.length} items detected`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          DETECTED ITEMS
        </Text>
        <Badge variant="secondary">
          <UIText className="text-[9px]">
            {result.items.length} {result.items.length === 1 ? 'ITEM' : 'ITEMS'}
          </UIText>
        </Badge>
      </View>

      {/* Item list */}
      {result.items.map((item, index) => {
        const confidence = Math.round(item.confidence * 100);
        return (
          <View key={index}>
            {index > 0 && <Separator className="my-2" />}
            <View className="mt-2 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-sans-medium text-xs text-primary">
                  {item.detectedFoodName}
                </Text>
                <Text className="mt-0.5 font-mono text-[10px] tabular-nums text-secondary">
                  ~{item.estimatedQuantity}
                  {item.estimatedUnit}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className="font-mono-bold text-sm tabular-nums text-accent-green"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {item.estimatedMacros.calories}
                </Text>
                <Text className="font-mono text-[9px] text-muted">
                  {confidence}% match
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Total */}
      <Separator className="my-3" />
      <NutritionGrid macros={result.total} size="sm" />
    </View>
  );
}
