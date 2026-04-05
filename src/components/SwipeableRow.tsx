import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';

const DELETE_REVEAL_WIDTH = 84;
const REGISTER_REVEAL_WIDTH = 84;
const OPEN_THRESHOLD = 52;
const ACTION_SCALE_MAX = 1;
const ACTION_SCALE_MIN = 0.86;

// Release velocity / displacement threshold to trigger the action (right swipe)
const REGISTER_VELOCITY_THRESHOLD = 0.28;

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  onRegister?: () => void;
  onPress?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  disabled?: boolean;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

export function SwipeableRow({
  children,
  onDelete,
  onRegister,
  onPress,
  onOpen,
  onClose,
  isOpen = false,
  disabled = false,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentOffsetRef = useRef(0);
  const isOpenRef = useRef(false);
  const movedDuringGestureRef = useRef(false);

  // ── Left (delete) side ──────────────────────────────────────────────────────
  const deleteScale = translateX.interpolate({
    inputRange: [-DELETE_REVEAL_WIDTH, 0],
    outputRange: [ACTION_SCALE_MAX, ACTION_SCALE_MIN],
    extrapolate: 'clamp',
  });
  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_REVEAL_WIDTH, -18, 0],
    outputRange: [1, 0.74, 0.46],
    extrapolate: 'clamp',
  });

  // ── Right (register) side ───────────────────────────────────────────────────
  const registerScale = translateX.interpolate({
    inputRange: [0, REGISTER_REVEAL_WIDTH],
    outputRange: [ACTION_SCALE_MIN, ACTION_SCALE_MAX],
    extrapolate: 'clamp',
  });
  const registerOpacity = translateX.interpolate({
    inputRange: [0, 12, REGISTER_REVEAL_WIDTH],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  // ── Card scale (subtle) ─────────────────────────────────────────────────────
  const cardScale = translateX.interpolate({
    inputRange: [-DELETE_REVEAL_WIDTH, 0, REGISTER_REVEAL_WIDTH],
    outputRange: [0.985, 1, 0.985],
    extrapolate: 'clamp',
  });

  function animateTo(toValue: number, callbacks?: { notifyOpen?: boolean; notifyClose?: boolean }) {
    currentOffsetRef.current = toValue;
    isOpenRef.current = toValue !== 0;

    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 260,
      friction: 22,
    }).start();

    if (callbacks?.notifyOpen && toValue !== 0) {
      onOpen?.();
    }

    if (callbacks?.notifyClose && toValue === 0) {
      onClose?.();
    }
  }

  function closeRow() {
    animateTo(0, { notifyClose: true });
  }

  useEffect(() => {
    const target = isOpen ? -DELETE_REVEAL_WIDTH : 0;

    if (currentOffsetRef.current !== target || isOpenRef.current !== isOpen) {
      animateTo(target);
    }
  }, [isOpen]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gestureState) => {
          if (disabled) return false;
          // Don't allow right swipe if onRegister is not provided
          if (gestureState.dx > 0 && !onRegister) return false;
          return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4;
        },
        onPanResponderGrant: () => {
          movedDuringGestureRef.current = false;
          translateX.stopAnimation((value) => {
            currentOffsetRef.current = value;
            isOpenRef.current = value !== 0;
          });
        },
        onPanResponderMove: (_event, gestureState) => {
          movedDuringGestureRef.current = true;
          const nextValue = clamp(
            currentOffsetRef.current + gestureState.dx,
            -DELETE_REVEAL_WIDTH,
            onRegister ? REGISTER_REVEAL_WIDTH : 0,
          );
          translateX.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const maxRight = onRegister ? REGISTER_REVEAL_WIDTH : 0;
          const releasedValue = clamp(
            currentOffsetRef.current + gestureState.dx,
            -DELETE_REVEAL_WIDTH,
            maxRight,
          );

          // Right swipe → register action (fire-and-forget, no detent)
          if (onRegister && (releasedValue >= OPEN_THRESHOLD || gestureState.vx > REGISTER_VELOCITY_THRESHOLD)) {
            animateTo(0, { notifyClose: true });
            onRegister();
            return;
          }

          // Left swipe → open delete reveal
          const shouldOpenDelete = releasedValue <= -OPEN_THRESHOLD || gestureState.vx < -REGISTER_VELOCITY_THRESHOLD;
          animateTo(shouldOpenDelete ? -DELETE_REVEAL_WIDTH : 0, {
            notifyOpen: shouldOpenDelete,
            notifyClose: !shouldOpenDelete,
          });
        },
        onPanResponderTerminate: () => {
          animateTo(isOpenRef.current ? -DELETE_REVEAL_WIDTH : 0);
        },
      }),
    [disabled, onClose, onOpen, onRegister, translateX]
  );

  function handleDeletePress() {
    closeRow();
    setTimeout(onDelete, 120);
  }

  function handleForegroundPress() {
    if (movedDuringGestureRef.current) {
      movedDuringGestureRef.current = false;
      return;
    }

    if (isOpenRef.current) {
      closeRow();
      if (onPress) {
        setTimeout(onPress, 120);
      }
      return;
    }

    onPress?.();
  }

  return (
    <View className="relative overflow-hidden rounded-[28px]">
      {/* ── Delete button (left reveal, sliding from right edge) ── */}
      <Animated.View
        className="absolute inset-y-0 right-0 items-center justify-center rounded-r-[28px] bg-red-500"
        style={{
          width: DELETE_REVEAL_WIDTH,
          opacity: deleteOpacity,
          transform: [{ scale: deleteScale }],
        }}
      >
        <Pressable
          onPress={handleDeletePress}
          className="h-full w-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Eliminar receta"
        >
          <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
          <Text className="mt-1 font-sans text-[10px] uppercase tracking-[1px] text-white/90">
            Borrar
          </Text>
        </Pressable>
      </Animated.View>

      {/* ── Register button (right reveal, sliding from left edge) ── */}
      {onRegister && (
        <Animated.View
          className="absolute inset-y-0 left-0 items-center justify-center rounded-l-[28px] bg-emerald-600"
          style={{
            width: REGISTER_REVEAL_WIDTH,
            opacity: registerOpacity,
            transform: [{ scale: registerScale }],
          }}
        >
          <Pressable
            onPress={() => { closeRow(); onRegister?.(); }}
            className="h-full w-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Registrar receta hoy"
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2.2} />
            <Text className="mt-1 font-sans text-[10px] uppercase tracking-[1px] text-white/90">
              Registrar
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Foreground card ── */}
      <Animated.View
        className="rounded-[28px] bg-surface"
        style={{ transform: [{ translateX }, { scale: cardScale }] }}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={handleForegroundPress} accessible={false}>
          <View className="rounded-[28px] bg-surface">{children}</View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
