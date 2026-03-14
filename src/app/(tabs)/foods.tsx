import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search } from 'lucide-react-native';
import { FoodListItem } from '@/components/FoodListItem';
import { FoodListItemSkeleton, SkeletonBlock } from '@/components/QuerySkeletons';
import { ScreenTransition } from '@/components/ScreenTransition';
import { Input } from '@/components/ui/input';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';

export default function FoodsScreen() {
  const [query, setQuery] = useState('');
  const { data: foods = [], isLoading } = useFoodsQuery(query);
  const isInitialLoading = isLoading && foods.length === 0;

  const filtered = useMemo(() => foods, [foods]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <Text className="font-sans text-sm text-secondary">Tu base de datos afinada</Text>
            <View className="mt-1 flex-row items-center justify-between gap-3">
              <Text className="font-sans-bold text-[31px] leading-[34px] text-primary">
                Alimentos
              </Text>
              <Link href="/food/add" asChild>
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-full border border-border bg-forest-panelAlt active:opacity-85"
                  accessibilityRole="button"
                  accessibilityLabel="Anadir alimento"
                >
                  <Plus size={20} color="#F5F7F2" strokeWidth={2.2} />
                </Pressable>
              </Link>
            </View>

            <View className="mt-6">
              <Text className="font-sans text-sm leading-6 text-secondary">
                Busca alimentos concretos, revisa sus macros y reutiliza entradas fiables como si fueran sugerencias curadas para tu dia a dia.
              </Text>

              <View className="mt-5 flex-row items-end justify-between border-b border-border pb-4">
                <View>
                  <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Tamaño del catalogo</Text>
                  {isInitialLoading ? (
                    <SkeletonBlock className="mt-3 h-10 w-12 rounded-full" />
                  ) : (
                    <Text className="mt-2 font-sans-bold text-[36px] text-primary">{filtered.length}</Text>
                  )}
                </View>

                
              </View>

              <View className="mt-5 flex-row items-center rounded-[22px] border border-border bg-surface/85 px-4 py-2.5">
                <Search size={16} color="#70806E" strokeWidth={1.8} />
                <Input
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar alimentos"
                  className="border-0 bg-transparent pl-3"
                  inputMode="search"
                  accessibilityLabel="Buscar alimentos"
                />
              </View>
            </View>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-3'}`}>
            <Link href={{ pathname: '/food/[id]', params: { id: item.id } }} asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={`Abrir alimento ${item.name}`}>
                <FoodListItem food={item} />
              </Pressable>
            </Link>
          </ScreenTransition>
        )}
        ListEmptyComponent={
          isInitialLoading ? (
            <View className="px-5 pt-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <ScreenTransition key={index} delay={40 + index * 20} className={index === 0 ? '' : 'mt-3'}>
                  <FoodListItemSkeleton />
                </ScreenTransition>
              ))}
            </View>
          ) : (
            <View className="px-5">
              <View className="border-t border-border py-6">
                <Text className="font-sans-medium text-base text-primary">No hay alimentos que encajen</Text>
                <Text className="mt-2 font-sans text-sm text-secondary">
                  Prueba con otra busqueda o crea una entrada nueva.
                </Text>
              </View>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
