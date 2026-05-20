export const backendConfig = {
  appName: 'calorie-compass',
  environmentName: 'prod',
  region: 'eu-south-2',
  accountId: '651045361536',
  existingCognito: {
    userPoolId: 'eu-south-2_bPRMn2ad9',
    userPoolClientId: '1joifova376ngpurjpbh8fhgbn',
  },
  tables: {
    app: 'calorie-compass-prod-app',
    barcodeCache: 'calorie-compass-prod-barcode-cache',
  },
  openFoodFacts: {
    baseUrl: 'https://world.openfoodfacts.org',
    fields: 'product_name,brands,nutriments',
    timeoutMs: '4000',
    cacheTtlOkSeconds: `${60 * 60 * 24 * 14}`,
    cacheTtlNotFoundSeconds: `${60 * 60 * 24}`,
    cacheTtlIncompleteSeconds: `${60 * 60 * 6}`,
    memCacheTtlMs: `${10 * 60 * 1000}`,
  },
};

export function getJwtIssuer() {
  return `https://cognito-idp.${backendConfig.region}.amazonaws.com/${backendConfig.existingCognito.userPoolId}`;
}
