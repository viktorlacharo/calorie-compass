import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Text className="font-mono-bold text-6xl text-primary">404</Text>
      <Text className="mt-2 font-sans text-sm text-secondary">
        Esta pantalla no existe.
      </Text>
      <Link href="/" className="mt-6">
        <Text className="font-sans-medium text-sm text-primary underline">
          Volver al inicio
        </Text>
      </Link>
    </View>
  );
}
