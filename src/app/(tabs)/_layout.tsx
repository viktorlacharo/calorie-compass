import { Tabs } from "expo-router";
import { View } from "react-native";
import {
  LayoutGrid,
  UtensilsCrossed,
  Heart,
} from "lucide-react-native";

function TabIcon({
  Icon,
  focused,
}: {
  Icon: typeof LayoutGrid;
  focused: boolean;
}) {
  return (
    <View
      className={`items-center justify-center ${
        focused ? "opacity-100" : "opacity-40"
      }`}
    >
      <Icon
        size={20}
        color="#0C0A09"
        strokeWidth={focused ? 2.2 : 1.6}
      />
      {focused && (
        <View className="mt-1 h-[2px] w-4 rounded-full bg-primary" />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#0C0A09",
        tabBarInactiveTintColor: "#A8A29E",
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E7E5E4",
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "LOG",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={LayoutGrid} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Daily Log",
        }}
      />
      <Tabs.Screen
        name="foods"
        options={{
          title: "FOODS",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={UtensilsCrossed} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Food Catalog",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "DISHES",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Heart} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Favorite Dishes",
        }}
      />
    </Tabs>
  );
}
