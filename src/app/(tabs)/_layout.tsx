import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { ChartColumnBig, House, Salad, Soup } from 'lucide-react-native';
import { FloatingQuickAddButton } from '@/components/FloatingQuickAddButton';

function TabIcon({
  focused,
  label,
  Icon,
}: {
  focused: boolean;
  label: string;
  Icon: typeof House;
}) {
  const color = focused ? '#F5F7F2' : '#70806E';

  return (
    <View className="items-center gap-1">
      <View className={`rounded-full px-3 py-2 ${focused ? 'bg-forest-panelAlt' : 'bg-transparent'}`}>
        <Icon size={20} color={color} strokeWidth={focused ? 2.2 : 1.8} accessibilityLabel={label} />
      </View>
      <View className={`h-1 w-6 rounded-full ${focused ? 'bg-forest-line' : 'bg-transparent'}`} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: '#F5F7F2',
          tabBarInactiveTintColor: '#70806E',
          tabBarLabelStyle: {
            fontFamily: 'DMSans_500Medium',
            fontSize: 11,
            marginBottom: 2,
          },
          tabBarAllowFontScaling: true,
          tabBarStyle: {
            backgroundColor: '#0B160C',
            borderTopColor: '#243723',
            borderTopWidth: 1,
            height: 82,
            paddingTop: 10,
            paddingBottom: 10,
          },
          tabBarItemStyle: {
            borderRadius: 20,
            marginHorizontal: 2,
            marginVertical: 4,
            paddingTop: 2,
          },
          sceneStyle: {
            backgroundColor: '#07110A',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarAccessibilityLabel: 'Pestaña de inicio',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Inicio" Icon={House} />,
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Historial',
            tabBarAccessibilityLabel: 'Pestaña de historial',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Historial" Icon={ChartColumnBig} />,
          }}
        />
        <Tabs.Screen
          name="foods"
          options={{
            title: 'Alimentos',
            tabBarAccessibilityLabel: 'Pestaña de alimentos',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Alimentos" Icon={Salad} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Recetario',
            tabBarAccessibilityLabel: 'Pestaña de recetas',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Recetas" Icon={Soup} />,
          }}
        />
      </Tabs>
      <FloatingQuickAddButton />
    </View>
  );
}
