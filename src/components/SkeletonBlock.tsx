import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

type SkeletonBlockProps = ViewProps & {
  className?: string;
};

export function SkeletonBlock({ className, ...props }: SkeletonBlockProps) {
  return <View className={cn('rounded-full bg-forest-panelAlt/90', className)} {...props} />;
}
