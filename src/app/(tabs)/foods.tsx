import { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, ScanLine, Search } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { FoodListItem } from '@/components/FoodListItem';
import { mockFoods } from '@/mocks/nutrition';

export default function FoodsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return mockFoods;
    const q = query.toLowerCase();
    return mockFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* Header */}
      <View className="border-b border-border bg-surface px-5 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
            FOOD CATALOG
          </Text>
          <Text className="font-mono text-[10px] tabular-nums text-muted">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Search bar */}
        <View className="mt-2 flex-row items-center">
          <View className="relative flex-1">
            <View className="absolute left-3 top-0 z-10 h-full justify-center">
              <Search size={14} color="#A8A29E" strokeWidth={1.5} />
            </View>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search foods..."
              className="pl-9"
              inputMode="search"
              accessibilityLabel="Search foods"
              returnKeyType="search"
            />
          </View>
        </View>
      </View>

      {/* Food list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FoodListItem
            food={item}
            onPress={() => router.push(`/food/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center px-5 py-16">
            <Text className="font-sans-medium text-sm text-secondary">
              {query.trim() ? 'No matching foods' : 'No foods yet'}
            </Text>
            <Text className="mt-1 font-sans text-xs text-muted">
              {query.trim()
                ? 'Try a different search term'
                : 'Add foods manually or scan a nutrition label'}
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB row */}
      <View className="absolute bottom-6 right-5 flex-row gap-3">
        <Pressable
          onPress={() => router.push('/food/scan')}
          className="h-12 w-12 items-center justify-center rounded-sm border border-border bg-surface active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Scan Nutrition Label"
        >
          <ScanLine size={20} color="#0C0A09" strokeWidth={1.6} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/food/add')}
          className="h-12 w-12 items-center justify-center rounded-sm bg-primary active:bg-primary/90"
          accessibilityRole="button"
          accessibilityLabel="Add Food Manually"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
