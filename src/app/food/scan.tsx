import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ScanResultCard } from '@/components/ScanResultCard';
import { mockNutritionLabelScan } from '@/mocks/nutrition';

type ScanState = 'idle' | 'scanning' | 'result';

export default function ScanLabelScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('idle');

  function handleCapture() {
    setState('scanning');
    setTimeout(() => setState('result'), 1500);
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
          ESCANEAR ETIQUETA
        </Text>
      </View>

      <View className="flex-1 px-5">
        <View className="mt-5 aspect-[4/3] w-full items-center justify-center border border-dashed border-border bg-surface">
          {state === 'idle' && (
            <View className="items-center">
              <Camera size={32} color="#A8A29E" strokeWidth={1.2} />
              <Text className="mt-3 font-sans text-[10px] tracking-widest uppercase text-muted">
                PREVIA DE CAMARA
              </Text>
              <Text className="mt-1 font-sans text-xs text-secondary">
                Apunta a una etiqueta nutricional
              </Text>
            </View>
          )}
          {state === 'scanning' && (
            <View className="items-center">
              <Text className="font-mono-medium text-sm text-primary">Analizando...</Text>
              <Text className="mt-1 font-sans text-xs text-secondary">
                Extrayendo datos nutricionales
              </Text>
            </View>
          )}
          {state === 'result' && (
            <View className="items-center">
              <Check size={24} color="#16A34A" strokeWidth={2} />
              <Text className="mt-2 font-sans text-xs text-accent-green">
                Etiqueta detectada
              </Text>
            </View>
          )}
        </View>

        {state === 'idle' && (
          <Button onPress={handleCapture} className="mt-5" accessibilityLabel="Hacer foto de la etiqueta">
            <UIText>Hacer foto</UIText>
          </Button>
        )}

        {state === 'result' && (
          <View className="mt-5">
            <ScanResultCard result={mockNutritionLabelScan} variant="label" />
            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setState('idle')}
                accessibilityLabel="Repetir foto"
              >
                <UIText>Repetir</UIText>
              </Button>
              <Button
                className="flex-1"
                onPress={handleConfirm}
                accessibilityLabel="Guardar alimento escaneado"
              >
                <UIText>Guardar alimento</UIText>
              </Button>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
