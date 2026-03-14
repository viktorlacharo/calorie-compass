import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type QuickPromptChipsProps<T extends string> = {
  options: ChipOption<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
};

export function QuickPromptChips<T extends string>({
  options,
  selectedValue,
  onSelect,
}: QuickPromptChipsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={cn(
              'rounded-full px-4 py-3 active:opacity-90',
              selected ? 'bg-accent-blue/15' : 'bg-forest-panelAlt'
            )}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar ${option.label}`}
          >
            <Text
              className={cn(
                'font-sans-medium text-xs uppercase tracking-[1.4px]',
                selected ? 'text-accent-blue' : 'text-secondary'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
