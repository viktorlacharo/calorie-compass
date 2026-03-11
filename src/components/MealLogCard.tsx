import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Coffee, Cookie, MoonStar, SunMedium } from 'lucide-react-native';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/GlassPanel';
import { cn } from '@/lib/utils';
import type { MealLogEntry } from '@/types/nutrition';

const SOURCE_LABELS: Record<MealLogEntry['source'], string> = {
  manual: 'MANUAL',
  favorite: 'FAVORITO',
  'visual-analysis': 'IA',
};

type MealLogCardProps = {
  entry: MealLogEntry;
  onPress?: () => void;
  href?: Href;
  className?: string;
  variant?: 'dashboard' | 'timeline';
  showIcon?: boolean;
  showMacros?: boolean;
};

function getMealTone(isoDate: string) {
  const hour = new Date(isoDate).getHours();

  if (hour < 11) {
      return {
      title: 'Desayuno',
      Icon: Coffee,
      iconBg: 'bg-protein/15',
      iconColor: '#EC5B13',
    };
  }

  if (hour < 15) {
      return {
      title: 'Comida',
      Icon: SunMedium,
      iconBg: 'bg-carbs/15',
      iconColor: '#60A5FA',
    };
  }

  if (hour < 18) {
      return {
      title: 'Picoteo',
      Icon: Cookie,
      iconBg: 'bg-fat/15',
      iconColor: '#FBBF24',
    };
  }

  return {
    title: 'Cena',
    Icon: MoonStar,
    iconBg: 'bg-accent-green/15',
    iconColor: '#5DE619',
  };
}

export function MealLogCard({
  entry,
  onPress,
  href,
  className,
  variant = 'dashboard',
  showIcon = false,
  showMacros = true,
}: MealLogCardProps) {
  const time = new Intl.DateTimeFormat('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(entry.consumedAt));
  const tone = getMealTone(entry.consumedAt);
  const card = (
    <GlassPanel className={cn('px-4 py-4', variant === 'timeline' ? 'rounded-3xl' : '')}>
      <View className="flex-row gap-4">
        {showIcon ? (
          <View className="items-center">
            <View className={cn('h-12 w-12 items-center justify-center rounded-full border border-border', tone.iconBg)}>
              <tone.Icon size={20} color={tone.iconColor} strokeWidth={1.8} />
            </View>
          </View>
        ) : null}

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-sans-bold text-lg text-primary">{tone.title}</Text>
              <Text className="mt-1 font-sans text-sm text-secondary">
                {time} • {entry.total.calories} kcal
              </Text>
            </View>
            <Badge variant="secondary">
              <Text className="text-[9px] tracking-[1.5px] text-secondary">
                {SOURCE_LABELS[entry.source]}
              </Text>
            </Badge>
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border bg-forest-panelAlt">
              <tone.Icon size={24} color={tone.iconColor} strokeWidth={1.8} />
            </View>
            <View className="flex-1 justify-center">
              <Text className="font-sans-medium text-sm text-primary" numberOfLines={2}>
                {entry.notes ?? tone.title}
              </Text>
              {showMacros ? (
                <View className="mt-2 flex-row gap-4">
                  <View>
                    <Text className="font-sans text-[10px] uppercase tracking-[1.2px] text-muted">
                      Proteina
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-primary">
                      {entry.total.protein}g
                    </Text>
                  </View>
                  <View>
                    <Text className="font-sans text-[10px] uppercase tracking-[1.2px] text-muted">
                      Carbs
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-primary">
                      {entry.total.carbs}g
                    </Text>
                  </View>
                  <View>
                    <Text className="font-sans text-[10px] uppercase tracking-[1.2px] text-muted">
                      Grasa
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-primary">
                      {entry.total.fats}g
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </GlassPanel>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable
          className={cn('active:opacity-90', className)}
          accessibilityRole="button"
          accessibilityLabel={`${tone.title} a las ${time}, ${entry.total.calories} calorias`}
          accessibilityHint="Abre los detalles de la comida"
        >
          {card}
        </Pressable>
      </Link>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn('active:opacity-90', className)}
        accessibilityRole="button"
        accessibilityLabel={`${tone.title} a las ${time}, ${entry.total.calories} calorias`}
        accessibilityHint="Abre los detalles de la comida"
      >
        {card}
      </Pressable>
    );
  }

  return <View className={className}>{card}</View>;
}
