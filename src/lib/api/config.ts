export const apiConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '',
  aiMode: process.env.EXPO_PUBLIC_AI_API_MODE?.trim() === 'lambda' ? 'lambda' : 'mock',
};

export function hasApiBaseUrl() {
  return apiConfig.apiBaseUrl.length > 0;
}
