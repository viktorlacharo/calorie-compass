import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Search, Sparkles } from 'lucide-react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ScreenTransition } from '@/components/ScreenTransition';
import { GlassPanel } from '@/components/GlassPanel';
import { NutritionGrid } from '@/components/NutritionGrid';
import { useBarcodeLookupMutation } from '@/features/foods/queries/use-food-mutations';
import type { BarcodeLookupItem, BarcodeLookupResult } from '@/features/foods/domain/food.contracts';

type ScanState = 'camera' | 'fetching' | 'result' | 'error';

function resolveItemName(item: BarcodeLookupItem) {
  return item.brand ? `${item.detectedName} - ${item.brand}` : item.detectedName;
}

export default function ScanLabelScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('camera');
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);
  const scannerLockedRef = useRef(false);
  const barcodeLookupMutation = useBarcodeLookupMutation();

  async function handleStartScanner() {
    if (permission?.granted) {
      setState('camera');
      scannerLockedRef.current = false;
      return;
    }

    await requestPermission();
  }

  function handleRetry() {
    setLookupResult(null);
    setDetectedBarcode(null);
    setState('camera');
    scannerLockedRef.current = false;
  }

  function handleUseResult(item: BarcodeLookupItem) {
    router.push({
      pathname: '/food/add',
      params: {
        name: resolveItemName(item),
        calories: String(item.referenceMacros.calories),
        protein: String(item.referenceMacros.protein),
        carbs: String(item.referenceMacros.carbs),
        fats: String(item.referenceMacros.fats),
        serving: String(item.referenceAmount),
      },
    });
  }

  async function handleBarcodeDetected(event: BarcodeScanningResult) {
    const barcode = event.data?.trim();

    if (!barcode || scannerLockedRef.current) {
      return;
    }

    scannerLockedRef.current = true;
    setDetectedBarcode(barcode);
    setState('fetching');

    const result = await barcodeLookupMutation.mutateAsync(barcode);
    setLookupResult(result);
    setState(result.status === 'error' || result.status === 'not-found' ? 'error' : 'result');
  }

  const needsCameraPermission = !permission?.granted;
  const resolvedItem =
    lookupResult?.status === 'found'
      ? lookupResult.item
      : lookupResult?.status === 'incomplete'
        ? {
            ...lookupResult.item,
            referenceMacros: {
              calories: lookupResult.item.referenceMacros.calories ?? 0,
              protein: lookupResult.item.referenceMacros.protein ?? 0,
              carbs: lookupResult.item.referenceMacros.carbs ?? 0,
              fats: lookupResult.item.referenceMacros.fats ?? 0,
            },
          }
        : null;

  const confidence = resolvedItem ? Math.round(resolvedItem.confidence * 100) : null;


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
          <Text className="mt-1 font-sans-bold text-[30px] leading-[34px] text-primary">Escaneo de codigo</Text>

          <LinearGradient
            colors={['#122117', '#0C1710', '#07110A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-5 w-full aspect-[4/3] overflow-hidden rounded-[34px] border border-border"
          >
            <View className="absolute inset-0">
              {state === 'camera' && permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a'],
                  }}
                  onBarcodeScanned={handleBarcodeDetected}
                />
              ) : null}
            </View>

            {state !== 'camera' ? <View className="absolute inset-0 bg-canvas/45" /> : null}

            {state === 'camera' && !permission?.granted ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Camera size={30} color="#D6D3D1" strokeWidth={1.4} />
                </View>
                <Text className="mt-4 font-sans text-[10px] tracking-[2px] uppercase text-muted">Permiso de camara</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Activa la camara para escanear EAN-13, EAN-8 o UPC-A y buscar el alimento automaticamente.
                </Text>
              </View>
            ) : null}

            {state === 'fetching' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                  <Search size={28} color="#EC5B13" strokeWidth={1.8} />
                </View>
                <Text className="mt-4 font-mono-medium text-sm text-primary">Consultando producto...</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Camara cerrada. Buscando los datos del codigo detectado en el backend.
                </Text>
                {detectedBarcode ? (
                  <Text className="mt-3 font-mono text-xs text-primary">Codigo: {detectedBarcode}</Text>
                ) : null}
              </View>
            ) : null}

            {state === 'result' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-green/10">
                  <Check size={28} color="#16A34A" strokeWidth={2} />
                </View>
                <Text className="mt-4 font-sans-medium text-sm text-primary">Producto detectado</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  Ya tienes una propuesta lista para revisar y llevar al formulario de alta.
                </Text>
              </View>
            ) : null}

            {state === 'error' ? (
              <View className="flex-1 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  <Sparkles size={28} color="#D6D3D1" strokeWidth={1.8} />
                </View>
                <Text className="mt-4 font-sans-medium text-sm text-primary">No se pudo completar</Text>
                <Text className="mt-2 text-center font-sans text-sm leading-6 text-secondary">
                  {lookupResult?.status === 'not-found' || lookupResult?.status === 'error'
                    ? lookupResult.message
                    : 'No se pudo resolver el producto del codigo detectado.'}
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </ScreenTransition>

        {state === 'camera' ? (
          <ScreenTransition delay={40}>
            <GlassPanel className="mt-5 px-4 py-4">
              <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Consejo rapido</Text>
              <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                Centra el codigo en pantalla. En cuanto se detecte, la camara se cierra y empieza la consulta.
              </Text>
            </GlassPanel>

            {needsCameraPermission ? (
              <Button onPress={handleStartScanner} className="mt-5" accessibilityLabel="Permitir camara">
                <UIText>Permitir camara</UIText>
              </Button>
            ) : null}
          </ScreenTransition>
        ) : null}

        {state === 'result' ? (
          <ScreenTransition delay={60}>
            {resolvedItem ? (
              <GlassPanel className="mt-5 px-5 py-5">
                <Text className="font-sans text-[10px] uppercase tracking-[1.5px] text-secondary">Producto encontrado</Text>
                <Text className="mt-2 font-sans-bold text-xl text-primary">{resolvedItem.detectedName}</Text>
                {resolvedItem.brand ? (
                  <Text className="mt-1 font-sans text-sm text-secondary">Marca: {resolvedItem.brand}</Text>
                ) : null}
                {detectedBarcode ? (
                  <Text className="mt-1 font-mono text-xs text-secondary">Codigo: {detectedBarcode}</Text>
                ) : null}
                {confidence !== null ? (
                  <Text className="mt-2 font-sans text-xs uppercase tracking-[1.2px] text-secondary">
                    Confianza {confidence}%
                  </Text>
                ) : null}
                <NutritionGrid macros={resolvedItem.referenceMacros} size="sm" className="mt-4" />
                {lookupResult?.status === 'incomplete' ? (
                  <Text className="mt-3 font-sans text-sm leading-6 text-secondary">
                    Se han rellenado con 0 los macros faltantes. Revisa antes de guardar.
                  </Text>
                ) : null}
              </GlassPanel>
            ) : null}
            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleRetry}
                accessibilityLabel="Reintentar escaneo"
              >
                <UIText>Reintentar</UIText>
              </Button>
              <Button
                className="flex-1"
                onPress={() => {
                  if (resolvedItem) {
                    handleUseResult(resolvedItem);
                  }
                }}
                accessibilityLabel="Usar producto detectado"
                disabled={!resolvedItem}
              >
                <UIText>Usar datos</UIText>
              </Button>
            </View>
          </ScreenTransition>
        ) : null}

        {state === 'error' ? (
          <ScreenTransition delay={60}>
            <View className="mt-4 flex-row gap-3">
              <Button variant="outline" className="flex-1" onPress={handleRetry} accessibilityLabel="Reintentar escaneo">
                <UIText>Reintentar</UIText>
              </Button>
              <Button className="flex-1" onPress={() => router.push('/food/add')} accessibilityLabel="Completar manualmente">
                <UIText>Manual</UIText>
              </Button>
            </View>
          </ScreenTransition>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
