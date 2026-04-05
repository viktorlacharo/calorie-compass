/**
 * ScrubInput — input numérico con scrubbing horizontal estilo DAW/fitness.
 *
 * Interacciones:
 *   - Drag horizontal  → incrementa / decrementa el valor (1g por 3px)
 *   - Tap sin arrastrar (<5px de desplazamiento) → abre el teclado numérico
 *
 * Feedback:
 *   - Haptic Light en cada cambio de unidad entero
 *   - Indicadores ‹ › con fade-in/out Reanimated durante el drag
 *   - El contenedor se ilumina sutilmente mientras se arrastra
 */

import { useRef, useState } from 'react';
import { PanResponder, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** px de arrastre necesarios para cambiar 1 unidad */
const SENSITIVITY = 3;

/** px de movimiento máximo para considerar el gesto un "tap" (no drag) */
const TAP_THRESHOLD = 5;

const FAST = { duration: 80, easing: Easing.out(Easing.cubic) } as const;
const NORMAL = { duration: 140, easing: Easing.out(Easing.cubic) } as const;

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  sensitivity?: number;
  /** Clases NativeWind extra para el contenedor exterior */
  className?: string;
  accessibilityLabel?: string;
};

export function ScrubInput({
  value,
  onChange,
  min = 1,
  max = 9999,
  unit = 'g',
  sensitivity = SENSITIVITY,
  className,
  accessibilityLabel,
}: Props) {
  const inputRef = useRef<TextInput>(null);

  // valor interno como string para que el TextInput sea controlado correctamente
  const [inputValue, setInputValue] = useState(String(value));
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // acumulador de px para la fracción entre unidades
  const accumulatedDx = useRef(0);
  // valor al inicio del drag (referencia estable)
  const valueAtDragStart = useRef(value);
  // último valor entero emitido — para disparar haptic solo cuando cambia
  const lastEmittedInt = useRef(value);

  // Reanimated: opacidad de los indicadores ‹ ›
  const arrowOpacity = useSharedValue(0);
  // Reanimated: brillo del fondo del contenedor
  const bgOpacity = useSharedValue(0);

  const arrowStyle = useAnimatedStyle(() => ({ opacity: arrowOpacity.value }));
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(236, 91, 19, ${bgOpacity.value * 0.08})`,
  }));

  // sincroniza el inputValue cuando cambia desde fuera (ej. hydration del draft)
  const prevExternalValue = useRef(value);
  if (value !== prevExternalValue.current && !isFocused && !isScrubbing) {
    prevExternalValue.current = value;
    setInputValue(String(value));
  }

  function clamp(v: number) {
    return Math.min(max, Math.max(min, v));
  }

  function emitIfChanged(newValue: number) {
    const clamped = clamp(newValue);
    const intClamped = Math.round(clamped);

    if (intClamped !== lastEmittedInt.current) {
      lastEmittedInt.current = intClamped;
      // módulo nativo puede no estar disponible hasta el próximo rebuild del dev client
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    onChange(intClamped);
    setInputValue(String(intClamped));
  }

  const panResponder = useRef(
    PanResponder.create({
      // captura el gesto si el movimiento horizontal supera 3px
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 3 && Math.abs(gs.dx) > Math.abs(gs.dy),

      onPanResponderGrant: () => {
        accumulatedDx.current = 0;
        valueAtDragStart.current = value;
        lastEmittedInt.current = Math.round(value);
        setIsScrubbing(true);
        arrowOpacity.value = withTiming(1, FAST);
        bgOpacity.value = withTiming(1, FAST);
        // cierra el teclado si estaba abierto
        inputRef.current?.blur();
      },

      onPanResponderMove: (_e, gs) => {
        accumulatedDx.current = gs.dx;
        const delta = gs.dx / sensitivity;
        const newValue = valueAtDragStart.current + delta;
        emitIfChanged(newValue);
      },

      onPanResponderRelease: (_e, gs) => {
        setIsScrubbing(false);
        arrowOpacity.value = withTiming(0, NORMAL);
        bgOpacity.value = withTiming(0, NORMAL);

        // si apenas se movió, lo tratamos como tap → abre teclado
        if (Math.abs(gs.dx) < TAP_THRESHOLD && Math.abs(gs.dy) < TAP_THRESHOLD) {
          inputRef.current?.focus();
        }
      },

      onPanResponderTerminate: () => {
        setIsScrubbing(false);
        arrowOpacity.value = withTiming(0, NORMAL);
        bgOpacity.value = withTiming(0, NORMAL);
      },
    })
  ).current;

  function handleTextChange(text: string) {
    // permite que el usuario escriba libremente (incluido string vacío)
    setInputValue(text);
    const parsed = parseFloat(text);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  }

  function handleBlur() {
    setIsFocused(false);
    // normaliza el valor al hacer blur
    const parsed = parseFloat(inputValue);
    const safe = Number.isNaN(parsed) ? min : clamp(parsed);
    setInputValue(String(Math.round(safe)));
    onChange(safe);
  }

  return (
    <View
      className={`shrink-0 flex-row items-center gap-1.5 ${className ?? ''}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      {...panResponder.panHandlers}
    >
      {/* Indicador izquierdo ‹ */}
      <Animated.View style={arrowStyle}>
        <ChevronLeft size={12} color="#EC5B13" strokeWidth={2.5} />
      </Animated.View>

      {/* Input numérico */}
      <Animated.View
        style={containerStyle}
        className="h-9 w-16 items-center justify-center overflow-hidden rounded-xl border border-border"
      >
        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          inputMode="decimal"
          textAlign="center"
          className="h-full w-full text-center font-sans text-sm text-primary"
          style={{ padding: 0 }}
          editable={!isScrubbing}
          accessibilityLabel={accessibilityLabel ?? 'Cantidad'}
        />
      </Animated.View>

      {/* Indicador derecho › */}
      <Animated.View style={arrowStyle}>
        <ChevronRight size={12} color="#EC5B13" strokeWidth={2.5} />
      </Animated.View>

      {/* Unidad */}
      <Animated.Text
        className="font-sans text-xs text-muted"
        style={[{ marginLeft: -2 }]}
      >
        {unit}
      </Animated.Text>
    </View>
  );
}
