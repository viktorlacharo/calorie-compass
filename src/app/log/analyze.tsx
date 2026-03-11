import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ScanResultCard } from '@/components/ScanResultCard';
import { ScreenTransition } from '@/components/ScreenTransition';
import { mockVisualAnalysis } from '@/mocks/nutrition';

type AnalysisState = 'idle' | 'analyzing' | 'result';

export default function VisualAnalysisScreen() {
  const router = useRouter();
  const [state, setState] = useState<AnalysisState>('idle');

  function handleCapture() {
    setState('analyzing');
    setTimeout(() => setState('result'), 2000);
  }

  function handleConfirm() {
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Volver atras"
        >
          <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          ANALISIS VISUAL
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition variant="right" className="mx-5 mt-5">
          <View className="aspect-square w-auto items-center justify-center border border-dashed border-border bg-surface">
          {state === 'idle' && (
            <View className="items-center">
              <Camera size={40} color="#A8A29E" strokeWidth={1.2} />
              <Text className="mt-3 font-sans text-[10px] tracking-widest uppercase text-muted">
                PREVIA DE CAMARA
              </Text>
              <Text className="mt-1 font-sans text-xs text-secondary">Haz una foto al plato</Text>
            </View>
          )}
          {state === 'analyzing' && (
            <View className="items-center">
              <Text className="font-mono-medium text-sm text-primary">Analizando plato...</Text>
              <Text className="mt-1 text-center font-sans text-xs text-secondary">
                Identificando alimentos y estimando{`\n`}cantidades desde tu base de datos
              </Text>
            </View>
          )}
          {state === 'result' && (
            <View className="items-center">
              <Check size={32} color="#16A34A" strokeWidth={2} />
              <Text className="mt-2 font-sans text-xs text-accent-green">Analisis completado</Text>
            </View>
          )}
          </View>
        </ScreenTransition>

        {state === 'idle' && (
          <ScreenTransition variant="right" delay={50} className="px-5">
            <Button onPress={handleCapture} className="mt-5" accessibilityLabel="Hacer foto del plato">
              <UIText>Hacer foto al plato</UIText>
            </Button>
          </ScreenTransition>
        )}

        {state === 'result' && (
          <ScreenTransition variant="right" delay={60} className="mt-5 px-5">
            <ScanResultCard result={mockVisualAnalysis} variant="visual" />

            <Text className="mt-4 text-center font-sans text-xs text-secondary">
              Revisa los elementos detectados. Luego podras ajustar cantidades si hace falta.
            </Text>

            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setState('idle')}
                accessibilityLabel="Repetir foto"
              >
                <UIText>Repetir</UIText>
              </Button>
              <Button className="flex-1" onPress={handleConfirm} accessibilityLabel="Registrar esta comida">
                <UIText>Registrar comida</UIText>
              </Button>
            </View>
          </ScreenTransition>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
