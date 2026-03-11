import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

type GlassPanelProps = ViewProps & {
  glow?: boolean;
};

export function GlassPanel({ className, glow = false, ...props }: GlassPanelProps) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-[28px] border border-border bg-surface/90',
        glow && 'shadow-2xl',
        className
      )}
      {...props}
    />
  );
}
