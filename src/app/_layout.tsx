import "../../global.css";
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { useFonts } from "expo-font";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { QueryProvider } from "@/lib/react-query/QueryProvider";

SystemUI.setBackgroundColorAsync("#07110A");

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
        <View
          className="flex-1 items-center justify-center bg-canvas"
          accessibilityRole="alert"
          accessibilityLabel="Cargando aplicacion"
        >
          <ActivityIndicator size="small" color="#EC5B13" accessibilityLabel="Cargando" />
          <Text className="mt-3 text-xs tracking-widest uppercase text-secondary">
            Cargando...
          </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
