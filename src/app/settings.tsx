import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Globe, LogOut, Scale, Target } from 'lucide-react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { ScreenTransition } from '@/components/ScreenTransition';
import { Button } from '@/components/ui/button';
import { Text as UIText } from '@/components/ui/text';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { getUserDisplayName, getUserInitials, getUserSessionLabel, getUserSessionMeta } from '@/features/auth/utils/user-profile';

function SettingRow({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <GlassPanel className="px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
            {icon}
          </View>
          <View>
            <Text className="font-sans-medium text-base text-primary">{title}</Text>
            <Text className="mt-1 font-sans text-sm text-secondary">{value}</Text>
          </View>
        </View>
        <ChevronRight size={16} color="#70806E" strokeWidth={1.8} />
      </View>
    </GlassPanel>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const displayName = getUserDisplayName(user);
  const sessionLabel = getUserSessionLabel(user);
  const sessionMeta = getUserSessionMeta(user);
  const initials = getUserInitials(user);

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
        <Text className="font-sans text-[10px] tracking-widest uppercase text-secondary">
          AJUSTES
        </Text>
      </View>

      <ScreenTransition className="px-5 pt-5">
        <Text className="font-sans text-sm text-secondary">Preferencias de la app</Text>
        <Text className="mt-1 font-sans-bold text-[31px] leading-[34px] text-primary">
          Ajustes
        </Text>

        <Text className="mt-4 font-sans text-sm leading-6 text-secondary">
          Aqui podras centralizar tus preferencias personales, objetivos y formato de seguimiento.
        </Text>

        <GlassPanel className="mt-6 px-4 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full border border-border bg-forest-panelAlt">
              <Text className="font-sans-bold text-base uppercase text-primary">{initials}</Text>
            </View>

            <View className="flex-1">
              <Text className="font-sans-medium text-base text-primary">{displayName}</Text>
              <Text className="mt-1 font-sans text-sm text-secondary">{sessionLabel}</Text>
              {sessionMeta ? <Text className="mt-1 font-sans text-xs text-muted">{sessionMeta}</Text> : null}
            </View>
          </View>
        </GlassPanel>
      </ScreenTransition>

      <View className="mt-6 gap-3 px-5">
        <ScreenTransition delay={40}>
          <SettingRow
            title="Objetivo calorico"
            value="2200 kcal al dia"
            icon={<Target size={18} color="#EC5B13" strokeWidth={1.9} />}
          />
        </ScreenTransition>

        <ScreenTransition delay={80}>
          <SettingRow
            title="Unidad de peso"
            value="Kilogramos (kg)"
            icon={<Scale size={18} color="#60A5FA" strokeWidth={1.9} />}
          />
        </ScreenTransition>

        <ScreenTransition delay={120}>
          <SettingRow
            title="Idioma"
            value="Espanol"
            icon={<Globe size={18} color="#A7F3D0" strokeWidth={1.9} />}
          />
        </ScreenTransition>

        <ScreenTransition delay={160}>
          <SettingRow
            title="Sesion"
            value={sessionLabel}
            icon={<LogOut size={18} color="#F5F7F2" strokeWidth={1.9} />}
          />
        </ScreenTransition>

        <ScreenTransition delay={200}>
          <Button variant="outline" onPress={() => void signOut()} accessibilityLabel="Cerrar sesion">
            <LogOut size={16} color="#F5F7F2" strokeWidth={2} />
            <UIText>Cerrar sesion</UIText>
          </Button>
        </ScreenTransition>
      </View>
    </SafeAreaView>
  );
}
