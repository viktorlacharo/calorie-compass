import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { FoodListItem } from '@/components/FoodListItem';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { Input } from '@/components/ui/input';
import { mockFoods } from '@/mocks/nutrition';

export default function FoodsScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return mockFoods;
    const lower = query.toLowerCase();
    return mockFoods.filter((food) => food.name.toLowerCase().includes(lower));
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 36 }}
        ListHeaderComponent={
          <ScreenTransition className="px-5 pb-6 pt-2">
            <Text className="font-sans text-sm text-secondary">Tu base de datos afinada</Text>
            <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
              Alimentos
            </Text>

            <GlassPanel className="mt-6 px-4 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-[2px] text-secondary">
                    Tamano del catalogo
                  </Text>
                  <Text className="mt-2 font-sans-bold text-[30px] text-primary">{filtered.length}</Text>
                </View>
                <Text className="max-w-[170px] text-right font-sans text-sm leading-5 text-secondary">
                  Busca alimentos concretos, revisa sus macros y reutiliza entradas fiables.
                </Text>
              </View>

              <View className="mt-5 flex-row items-center rounded-2xl border border-border bg-forest-panelAlt px-3">
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
            </GlassPanel>
          </ScreenTransition>
        }
        renderItem={({ item, index }) => (
          <ScreenTransition delay={40} className={`mx-5 ${index === 0 ? '' : 'mt-3'}`}>
            <FoodListItem food={item} />
          </ScreenTransition>
        )}
        ListEmptyComponent={
          <View className="px-5">
            <GlassPanel className="px-4 py-6">
              <Text className="font-sans-medium text-base text-primary">No hay alimentos que encajen</Text>
              <Text className="mt-2 font-sans text-sm text-secondary">
                Prueba con otra busqueda o crea una entrada nueva.
              </Text>
            </GlassPanel>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
