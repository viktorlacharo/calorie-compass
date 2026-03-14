import { Image, Text, View } from 'react-native';
import { ChevronRight, Clock3, Heart } from 'lucide-react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { cn } from '@/lib/utils';
import type { FavoriteDish, MacroNutrients } from '@/types/nutrition';

type FavoriteDishCardProps = {
  dish: FavoriteDish;
  totals: MacroNutrients;
  className?: string;
};

export function FavoriteDishCard({ dish, totals, className }: FavoriteDishCardProps) {
  const cals = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(totals.calories);

  const macroFormatter = Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
  });

  return (
    <GlassPanel className={cn('overflow-hidden p-0', className)}>
      <Image source={{ uri: dish.imageUri }} className="h-44 w-full" resizeMode="cover" />

      <View className="px-4 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              {dish.tags.slice(0, 2).map((tag) => (
                <View key={tag} className="rounded-full bg-forest-panelAlt px-2.5 py-1">
                  <Text className="font-sans text-[10px] uppercase tracking-[1.3px] text-secondary">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mt-3 font-sans-bold text-[20px] leading-6 text-primary" numberOfLines={2}>
              {dish.name}
            </Text>

            <Text className="mt-2 font-sans text-sm leading-5 text-secondary" numberOfLines={2}>
              {dish.description}
            </Text>

            <View className="mt-3 flex-row flex-wrap items-center gap-3">
              <View className="flex-row items-center gap-1.5">
                <Clock3 size={13} color="#A8A29E" strokeWidth={1.8} />
                <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
                  {dish.prepMinutes} min
                </Text>
              </View>
              <View className="h-1 w-1 rounded-full bg-muted" />
              <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
                {dish.items.length} ingredientes
              </Text>
              <View className="h-1 w-1 rounded-full bg-muted" />
              <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-secondary">
                {dish.difficulty}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <View className="mb-2 h-9 w-9 items-center justify-center rounded-full border border-border bg-protein/10">
              <Heart size={14} color="#EC5B13" strokeWidth={1.8} />
            </View>
            <Text className="font-sans-bold text-lg text-primary">{cals}</Text>
            <Text className="font-sans text-[11px] uppercase tracking-[1.2px] text-brand">kcal</Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <View className="rounded-full bg-protein/10 px-3 py-2">
            <Text className="font-sans text-[11px] text-protein">P {macroFormatter.format(totals.protein)}g</Text>
          </View>
          <View className="rounded-full bg-carbs/10 px-3 py-2">
            <Text className="font-sans text-[11px] text-carbs">C {macroFormatter.format(totals.carbs)}g</Text>
          </View>
          <View className="rounded-full bg-fat/10 px-3 py-2">
            <Text className="font-sans text-[11px] text-fat">G {macroFormatter.format(totals.fats)}g</Text>
          </View>
          <View className="ml-auto h-10 w-10 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
            <ChevronRight size={16} color="#70806E" strokeWidth={1.7} />
          </View>
        </View>
      </View>
    </GlassPanel>
  );
}
