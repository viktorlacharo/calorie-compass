import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/features/auth/context/AuthProvider';

const PUBLIC_SEGMENTS = new Set(['login', '+not-found']);

function isPublicRoute(segments: string[]) {
  const firstSegment = segments[0] ?? '';
  return PUBLIC_SEGMENTS.has(firstSegment);
}

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas" accessibilityRole="alert" accessibilityLabel="Cargando sesion">
      <ActivityIndicator size="small" color="#EC5B13" accessibilityLabel="Cargando" />
      <Text className="mt-3 text-xs tracking-widest uppercase text-secondary">Preparando sesion...</Text>
    </View>
  );
}

export function AuthGate() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }

    const publicRoute = isPublicRoute(segments);

    if (status === 'authenticated' && publicRoute) {
      router.replace('/(tabs)');
      return;
    }

    if (status === 'unauthenticated' && !publicRoute) {
      router.replace('/login');
    }
  }, [navigationState?.key, router, segments, status]);

  if (status === 'loading' || !navigationState?.key) {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated' && !isPublicRoute(segments)) {
    return <LoadingScreen />;
  }

  if (status === 'authenticated' && isPublicRoute(segments)) {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#07110A' },
          animation: 'slide_from_right',
          animationDuration: 220,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#07110A' },
        animation: 'slide_from_right',
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="food/add" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="food/scan" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="food/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="food/edit/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="favorite/create" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="favorite/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="log/analyze" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ai/suggestions" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="history/calendar" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
