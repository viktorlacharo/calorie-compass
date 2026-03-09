import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { ScanResultCard } from '@/components/ScanResultCard';
import { mockVisualAnalysis } from '@/mocks/nutrition';

type AnalysisState = 'idle' | 'analyzing' | 'result';

export default function VisualAnalysisScreen() {
  const router = useRouter();
  const [state, setState] = useState<AnalysisState>('idle');

  function handleCapture() {
    setState('analyzing');
    // Simulate AI processing delay
    setTimeout(() => setState('result'), 2000);
  }

  function handleConfirm() {
    // TODO: log the analyzed meal via API
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 items-center justify-center rounded-sm active:bg-canvas"
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ArrowLeft size={18} color="#0C0A09" strokeWidth={1.6} />
        </Pressable>
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          VISUAL ANALYSIS
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Camera placeholder */}
        <View className="mx-5 mt-5 aspect-square w-auto items-center justify-center border border-dashed border-border bg-surface">
          {state === 'idle' && (
            <View className="items-center">
              <Camera size={40} color="#A8A29E" strokeWidth={1.2} />
              <Text className="mt-3 font-sans text-[10px] tracking-widest uppercase text-muted">
                CAMERA PREVIEW
              </Text>
              <Text className="mt-1 font-sans text-xs text-secondary">
                Photograph your plate
              </Text>
            </View>
          )}
          {state === 'analyzing' && (
            <View className="items-center">
              <Text className="font-mono-medium text-sm text-primary">
                Analyzing plate{'\u2026'}
              </Text>
              <Text className="mt-1 text-center font-sans text-xs text-secondary">
                Identifying foods and estimating{'\n'}portions from your database
              </Text>
            </View>
          )}
          {state === 'result' && (
            <View className="items-center">
              <Check size={32} color="#16A34A" strokeWidth={2} />
              <Text className="mt-2 font-sans text-xs text-accent-green">
                Analysis complete
              </Text>
            </View>
          )}
        </View>

        {/* Capture button */}
        {state === 'idle' && (
          <View className="px-5">
            <Button
              onPress={handleCapture}
              className="mt-5"
              accessibilityLabel="Capture Plate Photo"
            >
              <UIText>Capture Plate</UIText>
            </Button>
          </View>
        )}

        {/* Analysis result */}
        {state === 'result' && (
          <View className="mt-5 px-5">
            <ScanResultCard
              result={mockVisualAnalysis}
              variant="visual"
            />

            <Text className="mt-4 text-center font-sans text-xs text-secondary">
              Review the detected items. You can adjust quantities after logging.
            </Text>

            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setState('idle')}
                accessibilityLabel="Retake Photo"
              >
                <UIText>Retake</UIText>
              </Button>
              <Button
                className="flex-1"
                onPress={handleConfirm}
                accessibilityLabel="Log This Meal"
              >
                <UIText>Log Meal</UIText>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
