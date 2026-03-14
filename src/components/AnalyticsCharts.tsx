import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { cn } from '@/lib/utils';

type SeriesPoint = {
  label: string;
  value: number;
};

type BarChartCardProps = {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  target?: number;
  accentColor?: string;
  targetColor?: string;
  footer?: string;
  className?: string;
};

type LineChartCardProps = {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  strokeColor?: string;
  footer?: string;
  className?: string;
};

type MacroTrendCardProps = {
  title: string;
  subtitle: string;
  metrics: Array<{
    label: string;
    value: string;
    progress: number;
    tone: string;
    fill: string;
  }>;
  className?: string;
};

function getBarHeight(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(12, (value / max) * 108);
}

export function BarChartCard({
  title,
  subtitle,
  points,
  target,
  accentColor = '#EC5B13',
  targetColor = '#5DE619',
  footer,
  className,
}: BarChartCardProps) {
  const max = Math.max(...points.map((point) => point.value), target ?? 0);

  return (
    <View className={cn(className)}>
      <Text className="font-sans-bold text-xl text-primary">{title}</Text>
      <Text className="mt-1 font-sans text-sm text-secondary">{subtitle}</Text>

      <View className="mt-6 flex-row items-end justify-between gap-3">
        {points.map((point) => {
          const height = getBarHeight(point.value, max);
          const targetHeight = target ? getBarHeight(target, max) : 0;

          return (
            <View key={point.label} className="flex-1 items-center">
              <View className="h-32 w-full items-center justify-end">
                <View className="absolute bottom-0 w-full rounded-full bg-black/20" style={{ height: 112 }} />
                {target ? (
                  <View
                    className="absolute w-full rounded-full"
                    style={{
                      bottom: targetHeight - 1,
                      borderTopWidth: 2,
                      borderTopColor: targetColor,
                    }}
                  />
                ) : null}
                <View className="w-full rounded-full" style={{ height, backgroundColor: accentColor }} />
              </View>
              <Text className="mt-3 font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
                {point.label}
              </Text>
              <Text className="mt-1 font-sans-medium text-xs text-primary">{point.value}</Text>
            </View>
          );
        })}
      </View>

      {footer ? <Text className="mt-5 font-sans text-xs text-secondary">{footer}</Text> : null}
    </View>
  );
}

export function MacroTrendCard({
  title,
  subtitle,
  metrics,
  className,
}: MacroTrendCardProps) {
  return (
    <View className={cn(className)}>
      <Text className="font-sans-bold text-xl text-primary">{title}</Text>
      <Text className="mt-1 font-sans text-sm text-secondary">{subtitle}</Text>

      <View className="mt-5 gap-4">
        {metrics.map((metric) => {
          const progress = Math.max(6, Math.min(metric.progress, 100));

          return (
            <View key={metric.label}>
              <View className="flex-row items-center justify-between">
                <Text className={cn('font-sans text-sm', metric.tone)}>{metric.label}</Text>
                <Text className="font-sans-medium text-sm text-primary">{metric.value}</Text>
              </View>
              <View className="mt-2 h-2 rounded-full bg-black/20">
                <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: metric.fill }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function LineChartCard({
  title,
  subtitle,
  points,
  strokeColor = '#A7F3D0',
  footer,
  className,
}: LineChartCardProps) {
  const width = 320;
  const height = 160;
  const paddingX = 10;
  const paddingY = 16;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.6);

  const coordinates = points.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
    const y = height - paddingY - ((point.value - min) / range) * (height - paddingY * 2);
    return { x, y, value: point.value, label: point.label };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <View className={cn(className)}>
      <Text className="font-sans-bold text-xl text-primary">{title}</Text>
      <Text className="mt-1 font-sans text-sm text-secondary">{subtitle}</Text>

      <View className="mt-5 overflow-hidden rounded-[22px] border border-border bg-forest-panelAlt px-3 py-4">
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect x="0" y="0" width={width} height={height} fill="transparent" />
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = paddingY + ratio * (height - paddingY * 2);
            return <Line key={ratio} x1="0" y1={y} x2={width} y2={y} stroke="#243723" strokeWidth="1" />;
          })}
          <Path d={path} fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {coordinates.map((point) => (
            <Circle key={point.label} cx={point.x} cy={point.y} r="5" fill={strokeColor} />
          ))}
        </Svg>

        <View className="mt-3 flex-row justify-between">
          {points.map((point) => (
            <View key={point.label} className="items-center">
              <Text className="font-sans text-[10px] uppercase tracking-[1.1px] text-secondary">
                {point.label}
              </Text>
              <Text className="mt-1 font-sans-medium text-xs text-primary">{point.value.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      </View>

      {footer ? <Text className="mt-5 font-sans text-xs text-secondary">{footer}</Text> : null}
    </View>
  );
}
