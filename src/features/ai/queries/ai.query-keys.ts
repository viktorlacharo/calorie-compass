export const aiQueryKeys = {
  all: ['ai'] as const,
  suggestions: (mode: string, focus?: string) => [...aiQueryKeys.all, 'suggestions', mode, focus ?? 'default'] as const,
  selectedRecipeDraft: () => [...aiQueryKeys.all, 'selected-recipe-draft'] as const,
};
