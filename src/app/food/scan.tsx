import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ScreenTransition } from '@/components/ScreenTransition';
import { GlassPanel } from '@/components/GlassPanel';
import { ScanResultCard } from '@/components/ScanResultCard';
import { useNutritionLabelScanMutation } from '@/features/ai/queries/use-ai-query';
import type { NutritionLabelScanResult } from '@/types/nutrition';

type ScanState = 'idle' | 'scanning' | 'result';

export default function ScanLabelScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('idle');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionLabelScanResult | null>(null);
  const nutritionLabelScanMutation = useNutritionLabelScanMutation();

  async function handleCapture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    setCapturedImageUri(result.assets[0].uri);
    setState('scanning');

    const scanResult = await nutritionLabelScanMutation.mutateAsync({ imageUri: result.assets[0].uri });
    setResult(scanResult);
    setState('result');
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
          <ArrowLeft size={18} color="#F5F7F2" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">ESCANEAR ETIQUETA</Text>
      </View>

      <View className="flex-1 px-5 pb-5">
        <ScreenTransition className="pt-5">
          <Text className="font-sans text-sm text-secondary">Captura precisa para tu catalogo</Text>
          <Text className="mt-1 font-sans-bold text-[30px] leading-[34px] text-primary">Escaneo de etiqueta</Text>

          <LinearGradient
            colors={['#122117', '#0C1710', '#07110A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-5 w-full aspect-[4/3] overflow-hidden rounded-[34px] border border-border"
          >
            <View className="absolute inset-0 bg-canvas/45" />

            {capturedImageUri ? (
              <Image source={{ uri: capturedImageUri }} className="absolute inset-0 h-full w-full" resizeMode="cover" />
            ) : null}

            <View className="absolute inset-0 bg-canvas/45" />

            {state === 'idle' && !capturedImageUri ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Camera size={30} color="#D6D3D1" strokeWidth={1.4} />
                </View>
                <Text className="mt-4 font-sans text-[10px] tracking-[2px] uppercase text-muted">Previa de camara</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Coloca la etiqueta recta y deja visible la tabla completa para obtener una lectura limpia.
                </Text>
              </View>
            ) : null}

            {state === 'scanning' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                  <Sparkles size={28} color="#EC5B13" strokeWidth={1.8} />
                </View>
                <Text className="mt-4 font-mono-medium text-sm text-primary">Leyendo la etiqueta...</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Extrayendo porcion, macros y consistencia para proponer una entrada fiable.
                </Text>
              </View>
            ) : null}

            {state === 'result' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-green/10">
                  <Check size={28} color="#16A34A" strokeWidth={2} />
                </View>
                <Text className="mt-4 font-sans-medium text-sm text-primary">Etiqueta detectada</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Ya tienes una propuesta lista para revisar y guardar en tu base de datos.
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </ScreenTransition>

        {state === 'idle' ? (
          <ScreenTransition delay={40}>
            <GlassPanel className="mt-5 px-4 py-4">
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Consejo rapido</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Cuanto mejor se vea la porcion y la tabla, menos correcciones tendras que hacer luego.
              </Text>
            </GlassPanel>

            <Button onPress={handleCapture} className="mt-5" accessibilityLabel="Hacer foto de la etiqueta">
              <UIText>Capturar etiqueta</UIText>
            </Button>
          </ScreenTransition>
        ) : null}

        {state === 'result' ? (
          <ScreenTransition delay={60}>
            {result ? <ScanResultCard result={result} variant="label" className="mt-5" /> : null}
            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  setCapturedImageUri(null);
                  setResult(null);
                  setState('idle');
                }}
                accessibilityLabel="Repetir foto"
              >
                <UIText>Repetir</UIText>
              </Button>
              <Button className="flex-1" onPress={handleConfirm} accessibilityLabel="Guardar alimento escaneado">
                <UIText>Guardar alimento</UIText>
              </Button>
            </View>
          </ScreenTransition>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
