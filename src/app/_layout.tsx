import "../../global.css";

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
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SystemUI.setBackgroundColorAsync("#FAFAF9");

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
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="small" color="#0C0A09" />
        <Text className="mt-3 text-xs tracking-widest uppercase text-secondary">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FAFAF9" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="food/add"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="food/scan"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="food/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="favorite/create"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="favorite/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="log/analyze"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  );
}
