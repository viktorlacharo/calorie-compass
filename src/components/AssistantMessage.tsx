import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Text as UIText } from '@/components/ui/text';

type AssistantMessageProps = {
  eyebrow?: string;
  title?: string;
  message: string;
  tone?: 'brand' | 'muted';
  visual?: 'logo' | 'loading';
};

const geminiLogo = require('../../assets/google-gemini.png');

export function AssistantMessage({
  eyebrow = 'Gemini',
  title,
  message,
  tone = 'brand',
  visual = 'logo',
}: AssistantMessageProps) {
  const containerTone = tone === 'brand' ? 'bg-forest-panelAlt' : 'bg-surface';
  const eyebrowTone = tone === 'brand' ? 'text-accent-blue' : 'text-secondary';
  const titleTone = tone === 'brand' ? 'text-primary' : 'text-primary';
  const bodyTone = tone === 'brand' ? 'text-secondary' : 'text-secondary';

  return (
    <View className={`overflow-hidden rounded-[30px] px-5 py-5 ${containerTone}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`font-sans text-[10px] uppercase tracking-[2px] ${eyebrowTone}`}>
            {eyebrow}
          </Text>
          {title ? <Text className={`mt-2 font-sans-bold text-[24px] leading-7 ${titleTone}`}>{title}</Text> : null}
          <Text className={`mt-3 font-sans text-sm leading-6 ${bodyTone}`}>{message}</Text>
        </View>

        <View className="items-end gap-2">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
            {visual === 'loading' ? (
              <ActivityIndicator size="small" color="#60A5FA" />
            ) : (
              <Image source={geminiLogo} className="h-7 w-7" resizeMode="contain" />
            )}
          </View>
          <Badge variant={tone === 'brand' ? 'secondary' : 'secondary'}>
            <UIText>Gemini</UIText>
          </Badge>
        </View>
      </View>
    </View>
  );
}
