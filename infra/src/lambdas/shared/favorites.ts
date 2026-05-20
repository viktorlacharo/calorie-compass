export type StoredFavorite = {
  entityType: 'FAVORITE';
  favoriteId: string;
  userSub: string;
  name: string;
  description: string;
  imageUri: string;
  prepMinutes: number;
  difficulty: string;
  servings: number;
  tags?: string[];
  steps?: string[];
  items?: Array<{ foodId: string; quantity: number }>;
  createdAt: string;
  updatedAt: string;
};

export function toApiFavorite(stored: StoredFavorite) {
  return {
    id: stored.favoriteId,
    userId: stored.userSub,
    name: stored.name,
    description: stored.description,
    imageUri: stored.imageUri,
    prepMinutes: stored.prepMinutes,
    difficulty: stored.difficulty,
    servings: stored.servings,
    tags: stored.tags ?? [],
    steps: stored.steps ?? [],
    items: stored.items ?? [],
    createdAt: stored.createdAt,
  };
}
