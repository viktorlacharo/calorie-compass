import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockKeyhole, LogIn, Mail } from 'lucide-react-native';
import { ScreenTransition } from '@/components/ScreenTransition';
import { useAuth } from '@/features/auth/context/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('viktorgym1999@gmail.com');
  const [password, setPassword] = useState('Ioc12345$');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSignIn() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      const authError = error as {
        name?: string;
        message?: string;
        cause?: { message?: string } | string;
        recoverySuggestion?: string;
      };

      const details = [
        authError?.name,
        authError?.message,
        typeof authError?.cause === 'string' ? authError.cause : authError?.cause?.message,
        authError?.recoverySuggestion,
      ]
        .filter(Boolean)
        .join(' | ');

      setErrorMessage(details || 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 px-5 pb-8 pt-5">
          <ScreenTransition>
            <Text className="font-sans text-sm text-secondary">Calorie Compass</Text>
            <Text className="mt-1 font-sans-bold text-[34px] leading-[36px] text-primary">Inicia sesion</Text>
            <Text className="mt-4 font-sans text-sm leading-6 text-secondary">
              Entra con tu cuenta para usar la app.
            </Text>
          </ScreenTransition>

          <ScreenTransition delay={40} className="mt-8">
            <View className="gap-5">
              <View>
                <Text className="mb-2 font-sans text-[10px] uppercase tracking-[1.6px] text-secondary">Email</Text>
                <View
                  className="flex-row items-center gap-3"
                  style={{
                    minHeight: 52,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(245, 247, 242, 0.18)',
                  }}
                >
                  <Mail size={16} color="#70806E" strokeWidth={1.8} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu-email@dominio.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    accessibilityLabel="Email"
                    placeholderTextColor="#94A394"
                    selectionColor="#EC5B13"
                    style={{
                      flex: 1,
                      color: '#F5F7F2',
                      fontSize: 16,
                      paddingVertical: 14,
                    }}
                  />
                </View>
              </View>

              <View>
                <Text className="mb-2 font-sans text-[10px] uppercase tracking-[1.6px] text-secondary">Contrasena</Text>
                <View
                  className="flex-row items-center gap-3"
                  style={{
                    minHeight: 52,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(245, 247, 242, 0.18)',
                  }}
                >
                  <LockKeyhole size={16} color="#70806E" strokeWidth={1.8} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contrasena"
                    secureTextEntry
                    textContentType="password"
                    accessibilityLabel="Contrasena"
                    onSubmitEditing={() => void handleSignIn()}
                    placeholderTextColor="#94A394"
                    selectionColor="#EC5B13"
                    style={{
                      flex: 1,
                      color: '#F5F7F2',
                      fontSize: 16,
                      paddingVertical: 14,
                    }}
                  />
                </View>
              </View>

              {errorMessage ? (
                <View className="mt-2 px-1 py-1" style={{ borderLeftWidth: 2, borderLeftColor: '#EC5B13' }}>
                  <Text className="font-sans-medium text-sm text-primary">No se pudo iniciar sesion</Text>
                  <Text className="mt-1 font-sans text-sm leading-6 text-secondary">{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => void handleSignIn()}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesion"
                accessibilityState={{ disabled: !canSubmit }}
                className="mt-4 flex-row items-center justify-center gap-2"
                style={{
                  minHeight: 52,
                  borderWidth: 1,
                  borderColor: canSubmit ? 'rgba(236, 91, 19, 0.55)' : 'rgba(112, 128, 110, 0.22)',
                  borderRadius: 18,
                  opacity: canSubmit ? 1 : 0.55,
                }}
              >
                {isSubmitting ? <ActivityIndicator size="small" color="#F5F7F2" /> : <LogIn size={16} color="#F5F7F2" strokeWidth={2} />}
                <Text className="font-sans-medium text-sm text-primary">{isSubmitting ? 'Entrando...' : 'Iniciar sesion'}</Text>
              </Pressable>

              <Pressable className="mt-4 py-2">
                <Text className="font-sans text-xs uppercase tracking-[1.5px] text-secondary">App privada</Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-secondary">
                  Esta app es una app privada para Andrea y Viktor.
                </Text>
              </Pressable>
            </View>
          </ScreenTransition>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
