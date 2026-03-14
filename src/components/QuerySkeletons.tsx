import { View } from 'react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { cn } from '@/lib/utils';

export { SkeletonBlock };

type ClassNameProps = {
  className?: string;
};

function MacroPillSkeleton({ className }: ClassNameProps) {
  return <SkeletonBlock className={cn('h-8 w-20 rounded-full', className)} />;
}

function DetailHeaderBarSkeleton({ className }: ClassNameProps) {
  return (
    <View className={cn('flex-row items-center justify-between border-b border-border bg-surface px-4 py-3', className)}>
      <View className="flex-row items-center gap-3">
        <SkeletonBlock className="h-9 w-9 rounded-sm" />
        <SkeletonBlock className="h-3 w-28 rounded-full" />
      </View>
      <SkeletonBlock className="h-9 w-9 rounded-sm" />
    </View>
  );
}

export function FoodListItemSkeleton({ className }: ClassNameProps) {
  return (
    <View className={cn('border-b border-border py-5', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <SkeletonBlock className="h-5 flex-1 rounded-full" />
            <SkeletonBlock className="h-5 w-24 rounded-full" />
          </View>

          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-1 w-1 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-1 w-1 rounded-full" />
            <SkeletonBlock className="h-3 w-24 rounded-full" />
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <MacroPillSkeleton />
        <MacroPillSkeleton />
        <MacroPillSkeleton />
      </View>
    </View>
  );
}

export function FavoriteDishCardSkeleton({ className }: ClassNameProps) {
  return (
    <GlassPanel className={cn('overflow-hidden p-0', className)}>
      <SkeletonBlock className="h-44 w-full rounded-none" />

      <View className="px-4 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row gap-2">
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </View>

            <SkeletonBlock className="mt-3 h-6 w-4/5 rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-full" />

            <View className="mt-4 flex-row flex-wrap items-center gap-3">
              <SkeletonBlock className="h-3 w-14 rounded-full" />
              <SkeletonBlock className="h-1 w-1 rounded-full" />
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="h-1 w-1 rounded-full" />
              <SkeletonBlock className="h-3 w-16 rounded-full" />
            </View>
          </View>

          <View className="items-end">
            <SkeletonBlock className="mb-2 h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="mt-2 h-3 w-10 rounded-full" />
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <MacroPillSkeleton />
          <MacroPillSkeleton />
          <MacroPillSkeleton />
          <SkeletonBlock className="ml-auto h-10 w-10 rounded-full" />
        </View>
      </View>
    </GlassPanel>
  );
}

export function MealLogCardSkeleton({ className }: ClassNameProps) {
  return (
    <GlassPanel className={cn('px-4 py-4', className)}>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <SkeletonBlock className="h-5 w-28 rounded-full" />
              <SkeletonBlock className="mt-2 h-4 w-36 rounded-full" />
            </View>
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </View>

          <View className="mt-4 flex-row gap-3">
            <SkeletonBlock className="h-16 w-16 rounded-2xl" />
            <View className="flex-1 justify-center">
              <SkeletonBlock className="h-4 w-3/4 rounded-full" />
              <View className="mt-3 flex-row gap-4">
                <View>
                  <SkeletonBlock className="h-3 w-14 rounded-full" />
                  <SkeletonBlock className="mt-2 h-3 w-10 rounded-full" />
                </View>
                <View>
                  <SkeletonBlock className="h-3 w-12 rounded-full" />
                  <SkeletonBlock className="mt-2 h-3 w-10 rounded-full" />
                </View>
                <View>
                  <SkeletonBlock className="h-3 w-12 rounded-full" />
                  <SkeletonBlock className="mt-2 h-3 w-10 rounded-full" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </GlassPanel>
  );
}

export function NutritionGridSkeleton({ className }: ClassNameProps) {
  return (
    <View className={cn('flex-row flex-wrap gap-3', className)}>
      {Array.from({ length: 3 }).map((_, index) => (
        <GlassPanel key={index} className="min-w-[31%] flex-1 px-4 py-4">
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="mt-4 h-8 w-14 rounded-full" />
          <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
        </GlassPanel>
      ))}
    </View>
  );
}

export function CalorieBudgetSkeleton({ className }: ClassNameProps) {
  return (
    <GlassPanel glow className={cn('px-5 py-5', className)}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <View className="mt-3 flex-row items-end gap-2">
            <SkeletonBlock className="h-11 w-28 rounded-full" />
            <SkeletonBlock className="mb-1 h-4 w-20 rounded-full" />
          </View>
        </View>

        <SkeletonBlock className="h-12 w-12 rounded-2xl" />
      </View>

      <SkeletonBlock className="mt-6 h-3 w-full rounded-full" />

      <View className="mt-4 flex-row items-center justify-between gap-3">
        <SkeletonBlock className="h-4 w-24 rounded-full" />
        <SkeletonBlock className="h-4 w-28 rounded-full" />
      </View>
    </GlassPanel>
  );
}

export function DashboardInsightSkeleton({ className }: ClassNameProps) {
  return (
    <GlassPanel className={cn('px-5 py-5', className)}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
        </View>
        <SkeletonBlock className="h-12 w-12 rounded-full" />
      </View>

      <View className="mt-5 flex-row flex-wrap gap-2">
        <SkeletonBlock className="h-9 w-32 rounded-full" />
      </View>

      <SkeletonBlock className="mt-5 h-20 w-full rounded-[24px]" />
    </GlassPanel>
  );
}

export function AnalyticsOverviewSkeleton({ className }: ClassNameProps) {
  return (
    <View className={cn('gap-4', className)}>
      <View className="px-1">
        <SkeletonBlock className="h-6 w-44 rounded-full" />
        <SkeletonBlock className="mt-2 h-4 w-full rounded-full" />
        <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
        <View className="mt-6 flex-row items-end justify-between gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} className="flex-1 items-center">
              <SkeletonBlock className="h-32 w-full rounded-full" />
              <SkeletonBlock className="mt-3 h-3 w-7 rounded-full" />
              <SkeletonBlock className="mt-2 h-3 w-9 rounded-full" />
            </View>
          ))}
        </View>
        <SkeletonBlock className="mt-5 h-4 w-4/5 rounded-full" />
      </View>

      <View className="px-1 py-1">
        <SkeletonBlock className="h-6 w-36 rounded-full" />
        <View className="mt-5 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} className="px-1 py-1">
              <SkeletonBlock className="h-3 w-20 rounded-full" />
              <SkeletonBlock className="mt-3 h-8 w-16 rounded-full" />
              {index < 2 ? <View className="mt-4 h-px bg-border" /> : null}
            </View>
          ))}
        </View>
      </View>

      <View className="px-1">
        <SkeletonBlock className="h-6 w-40 rounded-full" />
        <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
        <View className="mt-5 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index}>
              <View className="flex-row items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-4 w-20 rounded-full" />
              </View>
              <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function CalendarGridSkeleton({ className }: ClassNameProps) {
  return (
    <GlassPanel className={cn('px-4 py-4', className)}>
      <SkeletonBlock className="h-3 w-28 rounded-full" />
      <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
      <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />

      <View className="mt-5 flex-row flex-wrap gap-2">
        {Array.from({ length: 14 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[68px] w-[13.4%] min-w-[44px] rounded-2xl" />
        ))}
      </View>
    </GlassPanel>
  );
}

export function FoodDetailSkeleton() {
  return (
    <>
      <DetailHeaderBarSkeleton />

      <View className="flex-1">
        <View className="px-5 pt-5">
          <SkeletonBlock className="h-7 w-2/3 rounded-full" />
          <View className="mt-3 flex-row flex-wrap gap-2">
            <SkeletonBlock className="h-7 w-16 rounded-full" />
            <SkeletonBlock className="h-7 w-28 rounded-full" />
          </View>
          <SkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
        </View>

        <View className="mx-5 my-4 h-px bg-border" />

        <View className="px-5">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <NutritionGridSkeleton className="mt-3" />
          <GlassPanel className="mt-8 px-4 py-4">
            <View className="gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index}>
                  <View className="flex-row items-center justify-between gap-3">
                    <SkeletonBlock className="h-4 w-24 rounded-full" />
                    <SkeletonBlock className="h-4 w-12 rounded-full" />
                  </View>
                  <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                </View>
              ))}
            </View>
          </GlassPanel>
        </View>
      </View>

      <View className="border-t border-border bg-surface px-5 py-4">
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
      </View>
    </>
  );
}

export function FoodFormSkeleton() {
  return (
    <>
      <DetailHeaderBarSkeleton className="justify-start" />

      <View className="flex-1">
        <View className="px-5 pt-5">
          <SkeletonBlock className="h-4 w-4/5 rounded-full" />
          <SkeletonBlock className="mt-2 h-8 w-48 rounded-full" />
          <SkeletonBlock className="mt-6 h-12 w-full rounded-[24px]" />
        </View>

        <View className="mt-8 px-5">
          <View className="flex-row gap-3">
            <SkeletonBlock className="h-12 flex-1 rounded-[24px]" />
            <SkeletonBlock className="h-12 w-16 rounded-full" />
          </View>
        </View>

        <View className="mt-8 px-5">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-full" />
          <View className="mt-4 flex-row gap-3">
            <SkeletonBlock className="h-12 flex-1 rounded-[24px]" />
            <SkeletonBlock className="h-12 flex-1 rounded-[24px]" />
          </View>
          <View className="mt-3 flex-row gap-3">
            <SkeletonBlock className="h-12 flex-1 rounded-[24px]" />
            <SkeletonBlock className="h-12 flex-1 rounded-[24px]" />
          </View>
        </View>

        <View className="mt-8 px-5">
          <View className="flex-row gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 min-w-[31%] flex-1 rounded-[24px]" />
            ))}
          </View>
        </View>

        <View className="mt-8 px-5">
          <SkeletonBlock className="h-3 w-36 rounded-full" />
          <View className="mt-4 border-b border-border pb-4">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-10 w-20 rounded-full" />
            <SkeletonBlock className="mt-2 h-3 w-24 rounded-full" />
          </View>
          <NutritionGridSkeleton className="mt-4" />
        </View>
      </View>

      <View className="border-t border-border bg-surface px-5 py-4">
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
      </View>
    </>
  );
}

export function FavoriteDetailSkeleton() {
  return (
    <>
      <View className="relative bg-canvas">
        <SkeletonBlock className="h-[500px] w-full rounded-none" />
        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-4 pb-6 pt-4">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <SkeletonBlock className="h-11 w-11 rounded-full" />
        </View>
        <View className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-36">
          <View className="flex-row gap-2">
            <SkeletonBlock className="h-7 w-16 rounded-full" />
            <SkeletonBlock className="h-7 w-20 rounded-full" />
          </View>
          <SkeletonBlock className="mt-4 h-8 w-4/5 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-full" />
          <View className="mt-4 flex-row gap-4">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
          </View>
        </View>
      </View>

      <View className="px-5 pt-1">
        <SkeletonBlock className="h-3 w-32 rounded-full" />
        <View className="mt-5 border-b border-border pb-5">
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="mt-3 h-11 w-24 rounded-full" />
          <SkeletonBlock className="mt-2 h-3 w-24 rounded-full" />
        </View>

        <View className="mt-5 flex-row flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-full" />
          <SkeletonBlock className="h-8 w-24 rounded-full" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </View>

        <NutritionGridSkeleton className="mt-5" />

        <GlassPanel className="mt-5 px-4 py-4">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
        </GlassPanel>
      </View>

      <View className="mx-5 my-5 h-px bg-border" />

      <View className="px-5">
        <View className="flex-row items-center justify-between gap-3">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-3 w-16 rounded-full" />
        </View>

        <View className="mt-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} className={index === 0 ? 'pb-5' : 'border-t border-border py-5'}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <SkeletonBlock className="h-4 w-40 rounded-full" />
                    <SkeletonBlock className="h-5 w-16 rounded-full" />
                  </View>
                  <View className="mt-3 flex-row items-center justify-between gap-3">
                    <SkeletonBlock className="h-3 w-16 rounded-full" />
                    <View className="flex-row gap-2">
                      <SkeletonBlock className="h-6 w-16 rounded-full" />
                      <SkeletonBlock className="h-6 w-16 rounded-full" />
                      <SkeletonBlock className="h-6 w-16 rounded-full" />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 my-5 h-px bg-border" />

      <View className="px-5">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <View className="mt-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} className={index === 0 ? 'flex-row gap-4 pb-5' : 'flex-row gap-4 border-t border-border py-5'}>
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <View className="flex-1">
                <SkeletonBlock className="h-4 w-full rounded-full" />
                <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-full" />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 my-5 h-px bg-border" />

      <View className="px-5 pb-28">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <View className="mt-3 gap-3">
          <SkeletonBlock className="h-24 w-full rounded-[28px]" />
          <SkeletonBlock className="h-24 w-full rounded-[28px]" />
        </View>
      </View>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-surface/95 px-5 py-8">
        <View className="flex-row gap-3">
          <SkeletonBlock className="h-12 w-12 rounded-2xl" />
          <SkeletonBlock className="h-12 flex-1 rounded-2xl" />
        </View>
      </View>
    </>
  );
}

export function PickerListSkeleton({ className, count = 4 }: ClassNameProps & { count?: number }) {
  return (
    <GlassPanel className={cn('px-4 py-4', className)}>
      <View className="flex-row items-center justify-between">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="h-3 w-14 rounded-full" />
      </View>

      <View className="mt-3">
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} className={index === 0 ? 'flex-row items-center justify-between px-2 py-3' : 'flex-row items-center justify-between border-t border-border px-2 py-3'}>
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <SkeletonBlock className="h-4 w-4 rounded-full" />
          </View>
        ))}
      </View>
    </GlassPanel>
  );
}
