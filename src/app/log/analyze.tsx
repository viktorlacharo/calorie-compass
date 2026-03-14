import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { GlassPanel } from '@/components/GlassPanel';
import { ScanResultCard } from '@/components/ScanResultCard';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useVisualAnalysisMutation } from '@/features/ai/queries/use-ai-query';
import { useFoodsQuery } from '@/features/foods/queries/use-foods-query';
import type { VisualAnalysisResult } from '@/types/nutrition';

type AnalysisState = 'idle' | 'analyzing' | 'result';

export default function VisualAnalysisScreen() {
  const router = useRouter();
  const [state, setState] = useState<AnalysisState>('idle');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<VisualAnalysisResult | null>(null);
  const { data: foods = [] } = useFoodsQuery('');
  const visualAnalysisMutation = useVisualAnalysisMutation();

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
    setState('analyzing');

    const analysisResult = await visualAnalysisMutation.mutateAsync({
      imageUri: result.assets[0].uri,
      foodsCatalog: foods,
    });
    setResult(analysisResult);
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
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">ANALISIS VISUAL</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenTransition className="px-5 pt-5">
          <Text className="font-sans text-sm text-secondary">Reconocimiento apoyado en tu base curada</Text>
          <Text className="mt-1 font-sans-bold text-[30px] leading-[34px] text-primary">Lectura del plato</Text>

          <LinearGradient
            colors={['#111E15', '#0B1510', '#07110A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-5 w-full aspect-square overflow-hidden rounded-[34px] border border-border"
          >
            <View className="absolute inset-0 bg-canvas/45" />

            {capturedImageUri ? (
              <Image source={{ uri: capturedImageUri }} className="absolute inset-0 h-full w-full" resizeMode="cover" />
            ) : null}

            <View className="absolute inset-0 bg-canvas/45" />

            {state === 'idle' && !capturedImageUri ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-18 w-18 items-center justify-center rounded-full bg-white/5">
                  <Camera size={34} color="#D6D3D1" strokeWidth={1.4} />
                </View>
                <Text className="mt-4 font-sans text-[10px] tracking-[2px] uppercase text-muted">Vista de captura</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Fotografia el plato desde arriba y deja los ingredientes bien separados para una deteccion mas estable.
                </Text>
              </View>
            ) : null}

            {state === 'analyzing' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-18 w-18 items-center justify-center rounded-full bg-accent-green/10">
                  <Sparkles size={30} color="#16A34A" strokeWidth={1.8} />
                </View>
                <Text className="mt-4 font-mono-medium text-sm text-primary">Interpretando el plato...</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Cruzando lo que ve la imagen con tu base de alimentos para proponer un desglose utilizable.
                </Text>
              </View>
            ) : null}

            {state === 'result' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-18 w-18 items-center justify-center rounded-full bg-accent-green/10">
                  <Check size={30} color="#16A34A" strokeWidth={2} />
                </View>
                <Text className="mt-4 font-sans-medium text-sm text-primary">Analisis completado</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Ya tienes una primera lectura de alimentos, cantidades aproximadas y macros estimados.
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </ScreenTransition>

        {state === 'idle' ? (
          <ScreenTransition delay={40} className="px-5">
            <GlassPanel className="mt-5 px-4 py-4">
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Antes de analizar</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Esta lectura prioriza platos reconocibles y se apoya en los alimentos exactos que ya tienes curados.
              </Text>
            </GlassPanel>

            <Button onPress={handleCapture} className="mt-5" accessibilityLabel="Hacer foto del plato">
              <UIText>Capturar plato</UIText>
            </Button>
          </ScreenTransition>
        ) : null}

        {state === 'result' ? (
          <ScreenTransition delay={60} className="px-5">
            {result ? <ScanResultCard result={result} variant="visual" className="mt-5" /> : null}

            <Text className="mt-4 text-center font-sans text-xs leading-5 text-secondary">
              Revisa el encaje de cada elemento y ajusta cantidades si ves una diferencia clara respecto a tu plato real.
            </Text>

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
              <Button className="flex-1" onPress={handleConfirm} accessibilityLabel="Registrar esta comida">
                <UIText>Registrar comida</UIText>
              </Button>
            </View>
          </ScreenTransition>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
