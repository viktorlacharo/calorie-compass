import { QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { createAppQueryClient } from '@/lib/react-query/query-client';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);

    void Network.getNetworkStateAsync().then((state) => {
      onlineManager.setOnline(Boolean(state.isConnected));
    });

    const networkSubscription = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(Boolean(state.isConnected));
    });

    return () => {
      appStateSubscription.remove();
      networkSubscription.remove();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
