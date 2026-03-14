import { Pressable, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';

export function FloatingQuickAddButton() {
  const { width } = useWindowDimensions();
  const rightOffset = Math.max(12, width * 0.125 - 28);

  return (
    <View
      pointerEvents="box-none"
      className="absolute z-50"
      style={{ bottom: 112, right: rightOffset }}
    >
      <Link href="/log/analyze" asChild>
        <Pressable
          className="h-14 w-14 items-center justify-center rounded-full border border-border bg-brand shadow-2xl active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel="Analizar plato"
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </Link>
    </View>
  );
}
