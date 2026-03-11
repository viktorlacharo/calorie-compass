import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { cn } from '@/lib/utils';

type ScreenTransitionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'down' | 'right';
};

export function ScreenTransition({
  children,
  className,
  delay = 0,
  variant = 'down',
}: ScreenTransitionProps) {
  const entering =
    variant === 'right'
      ? FadeInRight.duration(260).delay(delay)
      : FadeInDown.duration(260).delay(delay);

  return (
    <Animated.View
      entering={entering}
      className={cn(className)}
    >
      {children}
    </Animated.View>
  );
}
