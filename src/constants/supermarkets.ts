import type { ImageSourcePropType } from 'react-native';
import type { Supermarket } from '@/types/nutrition';

type SupermarketMeta = {
  id: Supermarket;
  label: string;
  logo: ImageSourcePropType;
};

export const SUPERMARKETS: SupermarketMeta[] = [
  {
    id: 'carrefour',
    label: 'Carrefour',
    logo: require('../../assets/carrefour_logo.png'),
  },
  {
    id: 'mercadona',
    label: 'Mercadona',
    logo: require('../../assets/mercadona_logo.png'),
  },
  {
    id: 'lidl',
    label: 'Lidl',
    logo: require('../../assets/lidl_logo.png'),
  },
  {
    id: 'aldi',
    label: 'Aldi',
    logo: require('../../assets/aldi_logo.png'),
  },
  {
    id: 'eroski',
    label: 'Eroski',
    logo: require('../../assets/eroski_logo.png'),
  },
];

export const supermarketMap: Record<Supermarket, SupermarketMeta> = {
  carrefour: SUPERMARKETS[0],
  mercadona: SUPERMARKETS[1],
  lidl: SUPERMARKETS[2],
  aldi: SUPERMARKETS[3],
  eroski: SUPERMARKETS[4],
};

export function getSupermarketMeta(supermarket?: Supermarket) {
  return supermarket ? supermarketMap[supermarket] : null;
}
