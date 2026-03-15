export const authConfig = {
  region: process.env.EXPO_PUBLIC_COGNITO_REGION?.trim() ?? '',
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID?.trim() ?? '',
  appClientId: process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID?.trim() ?? '',
};

export function hasCognitoConfig() {
  return Boolean(authConfig.region && authConfig.userPoolId && authConfig.appClientId);
}
